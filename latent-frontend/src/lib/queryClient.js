import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

// Query key factory — use everywhere to prevent key mismatches
export const qk = {
  feed:        (filter)  => ['feed', filter],
  post:        (id)      => ['post', id],
  events:      (filter)  => ['events', filter],
  event:       (id)      => ['event', id],
  mapLocs:     ()        => ['map', 'locations'],
  checkinsToday: ()      => ['checkins', 'today'],
  mess:        ()        => ['mess', 'today'],
  messMenu:    (id, day) => ['mess', 'menu', id, day],
  messList:    ()        => ['mess', 'messes'],
  tickets:     (status)  => ['mess', 'tickets', status],
  wallet:      ()        => ['mess', 'wallet'],
  clubs:       (cat)     => ['clubs', cat],
  club:        (id)      => ['club', id],
  clubPosts:   (id)      => ['club', id, 'posts'],
  clubEvents:  (id)      => ['club', id, 'events'],
  clubMembers: (id)      => ['club', id, 'members'],
  people:      (filters) => ['people', filters],
  profile:     (id)      => ['profile', id],
  profilePosts:(id)      => ['profile', id, 'posts'],
  activity:    (id)      => ['profile', id, 'activity'],
  lostFound:   (type)    => ['lost-found', type],
  market:      (cat)     => ['market', cat],
  studyGroups: (filters) => ['study-groups', filters],
  seniors:     (dept)    => ['seniors', dept],
  notifs:      ()        => ['notifications'],
  pulse:       ()        => ['pulse'],
  weather:     ()        => ['weather'],
  eventMemories: (id)    => ['event', id, 'memories'],
};
