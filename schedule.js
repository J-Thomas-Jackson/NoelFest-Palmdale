'use strict';
// Schedule of Events - Noel Fest 2026 (transcribed from the supplied schedule sheet).
// Each row: date (YYYY-MM-DD), event, categories[], entries[], venue, host, coordinator, phone, competition.
window.NF_SCHEDULE = (() => {
  const row = (date, event, categories, entries, venue, host, coordinator, phone, competition = true) =>
    ({ date, event, categories, entries, venue, host, coordinator, phone, competition });

  const ANY = ['No entry restrictions. Any number of participation in each category'];
  const ONE = ['One team from each association'];
  const RACKET = [
    '15 & Below - Boys (Doubles)',
    '15 & Below - Girls (Doubles)',
    '16 to 35 - Men (Doubles, Mixed Doubles)',
    '16 to 35 - Women (Doubles, Mixed Doubles)',
    '36 to 50 - Men (Doubles, Mixed Doubles)',
    '36 to 50 - Women (Doubles, Mixed Doubles)',
    'Above 50 - Men (Doubles, Mixed Doubles)',
    'Above 50 - Women (Doubles, Mixed Doubles)'
  ];
  const RACKET_ENTRIES = ['15 & Below - 2 teams', 'Other categories - 1 team from each association'];
  const GREENATURE = ['GREENATURE', 'GREENATURE', 'George', '98466 92159'];

  return [
    row('2026-10-24', 'Pickle Ball',
      ['Men (Doubles) - 19 & Below', 'Men (Doubles) - 20 to 49', 'Men (Doubles) - 50 & Above', 'Women (Doubles) - Open Category', 'Mixed Doubles - Open Category'],
      ['For each category 1 team per association'], 'PICKLE BOTS', 'CORE TEAM', 'George', '98466 92159'),
    row('2026-10-25', 'Flower Arrangement', ['For Ladies - Open Category'], ONE, 'ECOTAT', 'ECOTAT', 'Dr. Shine', '94973 00755'),
    row('2026-10-31', 'Carroms - Doubles', ['Category 18 and Below - Team 1', 'Category 18 and Below - Team 2', 'Category 18 Above - Team 1', 'Category 18 Above - Team 2'], ['2 teams in each category from each association'], 'ECODEN', 'ECODEN', 'Sudheer', '94969 33688'),
    row('2026-11-01', '8 Ball Pool', ['Open Category - Team 1', 'Open Category - Team 2', 'Womens - Team 1', 'Womens - Team 2'], ['2 teams from each association'], 'ECODEN', 'ECODEN', 'Sudheer', '94969 33688'),
    row('2026-11-07', 'Chess', ['18 & Below', 'Above 18'], ['2 participants in each category from each association'], 'TOUCHSTONE', 'TOUCHSTONE', 'Raina', '97466 07700'),
    row('2026-11-14', 'Candy Picking', ['Below 4 Years - Open Category', '4 to 7 Years - Open Category'], ANY, ...GREENATURE),
    row('2026-11-14', 'Painting', ['4 to 7 Years - Open Category', '8 to 12 Years - Open Category'], ANY, ...GREENATURE),
    row('2026-11-14', 'Bucket Throw', ['4 to 7 Years - Open Category'], ANY, ...GREENATURE),
    row('2026-11-14', 'Goal (Free Kick)', ['8 to 12 Years (Boys)', '8 to 12 Years (Girls)'], ANY, ...GREENATURE),
    row('2026-11-14', 'Basket Ball Free Throw', ['8 to 12 Years (Boys)', '8 to 12 Years (Girls)'], ANY, ...GREENATURE),
    row('2026-11-14', 'Freestyle Group Dance', ['Open Category'], ANY, ...GREENATURE, false),
    row('2026-11-15', 'Cricket', ['Open Category'], ['One team each association'], 'PARKWAY, KAKKANAD', 'CORE TEAM', 'Jai', '95353 66660'),
    row('2026-11-15', 'Throw Ball', ['For Ladies - Open Category'], ONE, 'OLROUND, KAKKANAD', 'CORE TEAM', 'Jai', '95353 66660'),
    row('2026-11-21', 'Table Tennis - Doubles', RACKET, RACKET_ENTRIES, 'EARTHSONG', 'EARTHSONG', 'Chandramohan', '94486 91525'),
    row('2026-11-22', 'Badminton - Doubles', RACKET, RACKET_ENTRIES, 'BRIGHTS SPORTS CENTRE, KANGARAPADY', 'ECODEN & CORE TEAM', 'Manu Abraham', '99614 82431'),
    row('2026-11-28', 'Music - Solo',
      ['Below 12 - (Boys & Girls together)', '12 to 18 - Boys, Girls', '19 to 59 - Men, Women', '60 & Above - Men, Women'],
      ['Below 12 - 2 entries', '12 to 18 (B) - 2 entries', '12 to 18 (G) - 2 entries', '19 to 59 (M) - 2 entries', '19 to 59 (W) - 2 entries', '60 & Above (M) - 2 entries', '60 & Above (W) - 2 entries'],
      'SERENIA', 'SERENIA', 'Radhika', '81294 56700'),
    row('2026-11-29', 'Nature Photography', ['Open Category'], ['4 participants from each association'], 'PALMDALE', 'PALMDALE', 'Roy John', '76240 16777'),
    row('2026-12-05', 'Cards', ['Open Category'], ['6 participants from each association'], 'POETRY', 'POETRY', 'Shiju', '99466 80101'),
    row('2026-12-06', 'Quiz', ['Open Category'], ['One team from each association (3 members)'], 'ARCADIA', 'ARCADIA', 'Joe Joseph', '95625 65479'),
    row('2026-12-06', 'Waterpolo', ['Men - 30 & Below, 31 to 49, 50 & Above', 'Women - Open Category'], ['One team for each category'], 'ARCADIA', 'ARCADIA', 'Joe Joseph', '95625 65479'),
    row('2026-12-12', 'Group Music', ['Open Category'], ONE, 'FRAGRANZ', 'FRAGRANZ', 'Rosemary', '96458 25133'),
    row('2026-12-19', 'Anthakshari', ['Open Category'], ONE, 'CLOUDWALK', 'CLOUDWALK', 'Sreejith', '70345 63456')
  ];
})();
