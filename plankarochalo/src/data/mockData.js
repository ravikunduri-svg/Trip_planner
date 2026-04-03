export const MEMBERS = [
  { id: 1, name: 'Shravan', initials: 'S', isOrganizer: true,  color: 'bg-violet-500' },
  { id: 2, name: 'Rahul',   initials: 'R', isOrganizer: false, color: 'bg-blue-500'   },
  { id: 3, name: 'Priya',   initials: 'P', isOrganizer: false, color: 'bg-pink-500'   },
  { id: 4, name: 'Aakash',  initials: 'A', isOrganizer: false, color: 'bg-amber-500'  },
  { id: 5, name: 'Mehak',   initials: 'M', isOrganizer: false, color: 'bg-green-500'  },
  { id: 6, name: 'Dev',     initials: 'D', isOrganizer: false, color: 'bg-orange-500' },
]

export const INITIAL_STAGES = [
  {
    id: 'destination',
    title: 'Destination',
    emoji: '🗺️',
    status: 'open',
    lockedOptionId: null,
    options: [
      { id: 1, label: 'Goa',         votes: [1, 2, 4] },
      { id: 2, label: 'Jaipur',      votes: [3]       },
      { id: 3, label: 'Manali',      votes: [5]       },
      { id: 4, label: 'Pondicherry', votes: []        },
    ],
  },
  {
    id: 'dates',
    title: 'Dates',
    emoji: '📅',
    status: 'open',
    lockedOptionId: null,
    options: [
      { id: 1, label: '12–15 May', votes: [1, 3]    },
      { id: 2, label: '19–22 May', votes: [2, 4, 5] },
      { id: 3, label: '26–29 May', votes: []        },
    ],
  },
  {
    id: 'budget',
    title: 'Budget',
    emoji: '💰',
    status: 'open',
    lockedOptionId: null,
    options: [
      { id: 1, label: '₹5k–₹8k',   votes: [5]       },
      { id: 2, label: '₹8k–₹12k',  votes: [1, 2, 3] },
      { id: 3, label: '₹12k–₹18k', votes: [4]       },
      { id: 4, label: '₹18k+',     votes: []        },
    ],
  },
  {
    id: 'stay',
    title: 'Stay',
    emoji: '🏠',
    status: 'open',
    lockedOptionId: null,
    options: [
      { id: 1, label: 'Hostel',          votes: [5]          },
      { id: 2, label: 'Airbnb / Villa',  votes: [1, 2, 3, 4] },
      { id: 3, label: 'Hotel',           votes: []           },
      { id: 4, label: 'Resort',          votes: []           },
    ],
  },
  {
    id: 'activities',
    title: 'Activities',
    emoji: '🎯',
    status: 'open',
    lockedOptionId: null,
    options: [
      { id: 1, label: 'Beach',        votes: [1, 2, 3, 4, 5] },
      { id: 2, label: 'Scooty',       votes: [1, 3, 4]       },
      { id: 3, label: 'Café hopping', votes: [2, 5]          },
      { id: 4, label: 'Nightlife',    votes: [1, 4]          },
      { id: 5, label: 'Water sports', votes: [3]             },
    ],
  },
]
