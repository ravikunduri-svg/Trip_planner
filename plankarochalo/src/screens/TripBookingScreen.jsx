import { useState } from 'react'
import { ArrowLeft, ExternalLink, Plane, Building2 } from 'lucide-react'
import posthog from 'posthog-js'

const CITY_IATA = {
  'Goa': 'GOI', 'Jaipur': 'JAI', 'Mumbai': 'BOM', 'Delhi': 'DEL',
  'Bangalore': 'BLR', 'Bengaluru': 'BLR', 'Hyderabad': 'HYD',
  'Chennai': 'MAA', 'Kolkata': 'CCU', 'Pune': 'PNQ', 'Kochi': 'COK',
  'Ahmedabad': 'AMD', 'Manali': 'BHU', 'Leh': 'IXL', 'Srinagar': 'SXR',
  'Varanasi': 'VNS', 'Udaipur': 'UDR', 'Amritsar': 'ATQ',
}

// "12–15 May" or "12-15 May" → { checkin: "2026-05-12", checkout: "2026-05-15" }
function parseDateRange(label) {
  if (!label) return null
  const match = label.match(/(\d{1,2})[–\-](\d{1,2})\s+([A-Za-z]+)/)
  if (!match) return null
  const [, start, end, monthStr] = match
  const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 }
  const month = months[monthStr.slice(0,3).toLowerCase()]
  if (month === undefined) return null
  const year = new Date().getFullYear()
  const pad = n => String(n).padStart(2, '0')
  return {
    checkin:  `${year}-${pad(month + 1)}-${pad(start)}`,
    checkout: `${year}-${pad(month + 1)}-${pad(end)}`,
    nights: parseInt(end) - parseInt(start),
  }
}

function track(provider, type) {
  posthog.capture('booking_link_clicked', { provider, type })
}

function BookLink({ href, label, logo, color, onClick }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`flex items-center justify-between p-3.5 rounded-2xl border ${color} hover:opacity-90 active:opacity-75 transition-opacity`}
    >
      <div className="flex items-center gap-3">
        <span className="text-base">{logo}</span>
        <span className="text-sm font-semibold text-gray-800">{label}</span>
      </div>
      <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
    </a>
  )
}

export default function TripBookingScreen({ trip, onBack }) {
  const [origin, setOrigin] = useState('DEL')

  // Extract locked values from stages
  const locked = {}
  for (const stage of (trip.stages || [])) {
    if (stage.status === 'locked' && stage.locked_option_id) {
      const opt = stage.options?.find(o => o.id === stage.locked_option_id)
      locked[stage.stage_key] = opt?.label
    }
  }

  const destination = locked.destination || ''
  const dateLabel   = locked.dates || ''
  const stayPref    = (locked.stay || '').toLowerCase()
  const pax         = trip.group_size || 2

  const iata    = CITY_IATA[destination] || null
  const dates   = parseDateRange(dateLabel)
  const city    = destination

  // ── Flight links ──────────────────────────────────────────────
  const utm = 'utm_source=plankarochalo&utm_campaign=trip_locked'

  function indigoUrl() {
    if (!iata || !dates) return `https://www.goindigo.in/?${utm}`
    return `https://www.goindigo.in/flight-booking.html?origin=${origin}&destination=${iata}&departDate=${dates.checkin}&adults=${pax}&${utm}`
  }

  function spicejetUrl() {
    if (!iata || !dates) return `https://www.spicejet.com/?${utm}`
    return `https://www.spicejet.com/?from=${origin}&to=${iata}&depart=${dates.checkin}&adults=${pax}&${utm}`
  }

  function airIndiaUrl() {
    if (!iata || !dates) return `https://www.airindia.com/?${utm}`
    return `https://www.airindia.com/book-flights.htm?org=${origin}&des=${iata}&dep=${dates.checkin}&adt=${pax}&${utm}`
  }

  function mmtFlightUrl() {
    return `https://www.makemytrip.com/flights/?${utm}`
  }

  // ── Hotel links ───────────────────────────────────────────────
  function bookingComUrl() {
    if (!city || !dates) return `https://www.booking.com/?${utm}`
    return `https://www.booking.com/search.html?ss=${encodeURIComponent(city)}&checkin=${dates.checkin}&checkout=${dates.checkout}&group_adults=${pax}&${utm}`
  }

  function airbnbUrl() {
    if (!city || !dates) return `https://www.airbnb.co.in/?${utm}`
    return `https://www.airbnb.co.in/s/${encodeURIComponent(city)}/homes?checkin=${dates.checkin}&checkout=${dates.checkout}&adults=${pax}&${utm}`
  }

  function mmtHotelUrl() {
    return `https://www.makemytrip.com/hotels/?${utm}`
  }

  function hostelworldUrl() {
    return `https://www.hostelworld.com/search?destination=${encodeURIComponent(city)}&dateFrom=${dates?.checkin || ''}&dateTo=${dates?.checkout || ''}&${utm}`
  }

  const isVilla    = stayPref.includes('villa')
  const isHostel   = stayPref.includes('hostel')
  const isResort   = stayPref.includes('resort')

  posthog.capture('booking_screen_viewed', { trip_id: trip.id, destination, dates: dateLabel })

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-10 pb-3">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Book Your Trip 🚀</h1>
            <p className="text-xs text-gray-400">{destination || 'Destination'} · {dateLabel || 'Dates TBD'} · {pax} people</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 pb-10">
        {/* Trip summary pill */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 flex flex-wrap gap-2 text-xs">
          {destination && <span className="bg-violet-100 text-violet-700 font-semibold px-2 py-1 rounded-full">📍 {destination}</span>}
          {dateLabel    && <span className="bg-violet-100 text-violet-700 font-semibold px-2 py-1 rounded-full">📅 {dateLabel}</span>}
          {locked.budget && <span className="bg-violet-100 text-violet-700 font-semibold px-2 py-1 rounded-full">💰 {locked.budget}/person</span>}
          {locked.stay   && <span className="bg-violet-100 text-violet-700 font-semibold px-2 py-1 rounded-full">🏠 {locked.stay}</span>}
        </div>

        {/* Origin picker */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Flying from</div>
          <select
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            className="w-full border border-gray-200 focus:border-violet-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
          >
            <option value="DEL">Delhi (DEL)</option>
            <option value="BOM">Mumbai (BOM)</option>
            <option value="BLR">Bengaluru (BLR)</option>
            <option value="HYD">Hyderabad (HYD)</option>
            <option value="MAA">Chennai (MAA)</option>
            <option value="CCU">Kolkata (CCU)</option>
            <option value="PNQ">Pune (PNQ)</option>
            <option value="COK">Kochi (COK)</option>
            <option value="AMD">Ahmedabad (AMD)</option>
          </select>
          {!iata && destination && (
            <p className="text-xs text-amber-600 mt-2">No airport mapping for "{destination}" — links open search pages.</p>
          )}
        </div>

        {/* Flights */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plane size={14} className="text-violet-600" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Flights</span>
          </div>
          <div className="space-y-2">
            <BookLink href={indigoUrl()}   label="IndiGo"       logo="🔵" color="border-blue-100 bg-blue-50"   onClick={() => track('indigo', 'flight')} />
            <BookLink href={spicejetUrl()} label="SpiceJet"     logo="🔴" color="border-red-100 bg-red-50"     onClick={() => track('spicejet', 'flight')} />
            <BookLink href={airIndiaUrl()} label="Air India"    logo="🇮🇳" color="border-orange-100 bg-orange-50" onClick={() => track('air_india', 'flight')} />
            <BookLink href={mmtFlightUrl()} label="MakeMyTrip"  logo="✈️" color="border-gray-100 bg-gray-50"   onClick={() => track('makemytrip', 'flight')} />
          </div>
        </div>

        {/* Hotels */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={14} className="text-violet-600" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {isHostel ? 'Hostels' : isVilla ? 'Villas' : isResort ? 'Resorts' : 'Hotels & Stays'}
            </span>
          </div>
          <div className="space-y-2">
            {isHostel ? (
              <BookLink href={hostelworldUrl()} label="Hostelworld"  logo="🎒" color="border-green-100 bg-green-50"  onClick={() => track('hostelworld', 'stay')} />
            ) : null}
            {(isVilla || !isHostel) && (
              <BookLink href={airbnbUrl()}      label="Airbnb"       logo="🏡" color="border-pink-100 bg-pink-50"    onClick={() => track('airbnb', 'stay')} />
            )}
            {!isVilla && (
              <BookLink href={bookingComUrl()}  label="Booking.com"  logo="🏨" color="border-blue-100 bg-blue-50"   onClick={() => track('booking_com', 'stay')} />
            )}
            <BookLink href={mmtHotelUrl()}     label="MakeMyTrip"   logo="🛎️" color="border-gray-100 bg-gray-50"   onClick={() => track('makemytrip', 'stay')} />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">
          Links open each platform pre-filled with your trip details.
        </p>
      </div>
    </div>
  )
}
