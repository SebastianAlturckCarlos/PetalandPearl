/* =============================================
   WEDDING ESTIMATE PRICING
   ---------------------------------------------
   This is the ONLY file you need to edit to change
   prices on the Wedding Estimate page.

   Each item has:
     id    - a short unique name (no spaces; don't change once live,
             it's used in saved/shared estimates)
     name  - what customers see
     desc  - a short description (optional)
     low   - the low end of the price range, per item (in dollars)
     high  - the high end of the price range, per item (in dollars)
     max   - the most a customer can select (optional, default 99)

   To add an item, copy one { ... } block and change it.
   To remove an item, delete its { ... } block.
   ============================================= */

window.ESTIMATE_PRICING = {
    // Minimum order for weddings. Set to 0 to turn off.
    // If the high end of an estimate is below this, the page shows a friendly note.
    weddingMinimum: 0,

    categories: [
        {
            id: 'personal',
            title: 'Personal Flowers',
            icon: 'fa-heart',
            blurb: 'Flowers carried and worn by you and your favorite people.',
            items: [
                { id: 'bridal-bouquet',     name: 'Bridal Bouquet',          desc: 'The showpiece. Lush, hand-tied, designed around your palette.', low: 200, high: 350, max: 3 },
                { id: 'bridesmaid-bouquet', name: 'Bridesmaid Bouquet',      desc: 'A smaller companion to the bridal bouquet.',                   low: 75,  high: 125 },
                { id: 'toss-bouquet',       name: 'Toss Bouquet',            desc: 'A petite bouquet made for tossing, so you can keep yours.',    low: 40,  high: 65,  max: 3 },
                { id: 'boutonniere',        name: 'Boutonniere',             desc: 'For the groom, groomsmen, dads, and ushers.',                  low: 15,  high: 25 },
                { id: 'corsage',            name: 'Corsage (Wrist or Pin)',  desc: 'For moms, grandmas, and honored guests.',                      low: 25,  high: 40 },
                { id: 'flower-crown',       name: 'Flower Crown',            desc: 'Fresh blooms woven into a crown.',                             low: 45,  high: 75 },
                { id: 'flower-girl',        name: 'Flower Girl Petals',      desc: 'A basket of loose petals for the walk down the aisle.',        low: 25,  high: 45,  max: 6 }
            ]
        },
        {
            id: 'ceremony',
            title: 'Ceremony',
            icon: 'fa-ring',
            blurb: 'Set the scene for the moment you say "I do."',
            items: [
                { id: 'arch',            name: 'Arch or Arbor Florals',     desc: 'Statement florals draped on your ceremony arch.',      low: 300, high: 700, max: 2 },
                { id: 'altar',           name: 'Altar Arrangement',         desc: 'Large arrangements flanking the altar or officiant.',  low: 125, high: 250, max: 6 },
                { id: 'aisle-marker',    name: 'Aisle Marker',              desc: 'Small arrangements lining the aisle or chairs.',       low: 25,  high: 60,  max: 40 },
                { id: 'petal-aisle',     name: 'Petal-Lined Aisle',         desc: 'Loose petals scattered along the aisle.',              low: 75,  high: 150, max: 2 }
            ]
        },
        {
            id: 'reception',
            title: 'Reception',
            icon: 'fa-champagne-glasses',
            blurb: 'Florals for the party: tables, cake, and every corner in between.',
            items: [
                { id: 'centerpiece',     name: 'Guest Table Centerpiece',   desc: 'One per guest table. Usually one table for every 8 guests.', low: 60,  high: 100, max: 60 },
                { id: 'head-table',      name: 'Head or Sweetheart Table',  desc: 'A long, low garland-style arrangement for your table.',       low: 150, high: 300, max: 2 },
                { id: 'bud-vase',        name: 'Bud Vase',                  desc: 'Single-stem accents for cocktail tables, bars, and more.',    low: 10,  high: 18,  max: 100 },
                { id: 'cocktail-table',  name: 'Cocktail Table Arrangement', desc: 'Petite arrangements for high-tops and side tables.',          low: 25,  high: 45,  max: 30 },
                { id: 'cake-flowers',    name: 'Cake Flowers',              desc: 'Fresh, food-safe blooms to dress up the cake.',               low: 35,  high: 75,  max: 3 },
                { id: 'welcome-sign',    name: 'Welcome Sign Florals',      desc: 'A floral spray to frame your welcome sign.',                  low: 75,  high: 150, max: 3 }
            ]
        }
    ],

    // One-click starting points. Quantities are by item id.
    // Customers can tweak everything after picking one.
    packages: [
        {
            id: 'essentials',
            name: 'Just the Essentials',
            tagline: 'Intimate weddings & elopements',
            items: { 'bridal-bouquet': 1, 'boutonniere': 1, 'corsage': 2, 'cake-flowers': 1 }
        },
        {
            id: 'classic',
            name: 'Classic Celebration',
            tagline: 'Around 100 guests',
            items: { 'bridal-bouquet': 1, 'bridesmaid-bouquet': 4, 'boutonniere': 7, 'corsage': 4, 'flower-girl': 1, 'altar': 2, 'centerpiece': 12, 'head-table': 1, 'cake-flowers': 1 }
        },
        {
            id: 'full-bloom',
            name: 'Full Bloom',
            tagline: 'Big party, all the flowers',
            items: { 'bridal-bouquet': 1, 'toss-bouquet': 1, 'bridesmaid-bouquet': 6, 'boutonniere': 10, 'corsage': 6, 'flower-girl': 2, 'arch': 1, 'aisle-marker': 10, 'petal-aisle': 1, 'centerpiece': 20, 'head-table': 1, 'cocktail-table': 6, 'cake-flowers': 1, 'welcome-sign': 1 }
        }
    ]
};
