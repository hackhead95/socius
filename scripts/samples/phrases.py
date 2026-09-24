# -*- coding: utf-8 -*-
"""Phrase bank for the synthetic open-ended answers in the Urban Trust sample survey.

Everything here is invented teaching material. Each theme has several registers:
  terse   - one to three words, the way people answer when they are in a hurry
  medium  - one plain sentence
  extra   - an elaboration or small story that can follow a medium sentence
  mixed   - Hinglish or Bengali-English phrasing (romanised)
  native  - a few answers written in Bengali (bn), Hindi (hi) or Tamil (ta) script

Placeholders filled in by make_survey.py:
  {nb}     local word for neighbourhood (para, colony, society, layout, nagar ...)
  {corp}   municipal body (KMC, MCD, BMC, BBMP, the Corporation, the panchayat ...)
  {rs}     an amount in rupees
  {hrs}    a small number of hours
  {yrs}    a small number of years
  {month}  a month name
"""

# ---------------------------------------------------------------------------
# Q: What is the biggest challenge facing your neighbourhood today?
# ---------------------------------------------------------------------------

CHALLENGE = {
    'water': {
        'terse': ['water problem', 'water shortage', 'drinking water', 'no regular water', 'water supply'],
        'medium': [
            'Water supply is very irregular, sometimes we get it for only one hour in the morning.',
            'We depend on tankers for drinking water and they charge {rs} rupees a trip.',
            'The {corp} water comes at odd times like five in the morning, so someone has to stay awake to fill the drums.',
            'The borewell went dry last summer and the tanker people charge whatever they like.',
            'Tap water is yellowish and smells, so we boil it or buy cans.',
            'In summer there is hardly any water in the pipeline for weeks at a time.',
            'Water pressure is so low that the upper floors get nothing at all.',
            'There is still no piped water connection in our lane, only one common tap.',
            'Getting enough clean water for the family is the main struggle.',
        ],
        'extra': [
            'My mother spends half her morning just arranging water.',
            'Last {month} we bought water cans every single day.',
            'Women and children stand in the queue with buckets.',
            'We have complained to the {corp} many times but nothing changes.',
            'Without a water purifier you cannot drink it.',
        ],
        'mixed': [
            'Paani ka bahut problem hai, tanker pe depend karna padta hai.',
            'Jol thik moto ase na, pressure khub kom.',
            'Water ka timing fixed nahi hai, kabhi subah kabhi raat.',
            'Summer mein paani bilkul nahi aata, daily cans lene padte hai.',
        ],
        'native': {
            'hi': ['पानी की बहुत दिक्कत है, टैंकर पर निर्भर रहना पड़ता है।',
                   'गर्मियों में नल में पानी ही नहीं आता।'],
            'bn': ['খাবার জলের খুব সমস্যা, কলে ঠিকমতো জল আসে না।'],
            'ta': ['குடிநீர் பிரச்சனை அதிகம்.'],
        },
    },
    'garbage': {
        'terse': ['garbage', 'garbage everywhere', 'sanitation', 'dirty roads', 'no cleanliness'],
        'medium': [
            'Garbage is not collected regularly and it piles up at the corner of the road.',
            'People throw waste in the open plot next to our building and it stinks.',
            'The garbage van comes maybe twice a week, so everyone just dumps it outside.',
            'Stray dogs tear open the garbage bags and it spreads all over the lane.',
            'There is no proper dustbin anywhere in the {nb}.',
            'Public toilets are dirty and there are not enough of them.',
            'Sanitation is very poor, the sweepers hardly come to our side.',
            'Nobody segregates waste and the {corp} does not enforce anything.',
        ],
        'extra': [
            'In the rainy season the smell is unbearable and mosquitoes breed.',
            'My children fell sick with dengue last year.',
            'We tried collecting money for a private cleaner but it stopped after two months.',
            'The vat near the market overflows every day.',
        ],
        'mixed': [
            'Kachra koi uthata hi nahi, sab road pe pada rehta hai.',
            'Moyla phelar jaiga nei, sob rastay pore thake.',
            'Garbage ka bahut issue hai, safai wala roz nahi aata.',
        ],
        'native': {
            'hi': ['कूड़ा हफ्तों तक पड़ा रहता है, कोई उठाने नहीं आता।'],
            'bn': ['ময়লা ঠিকমতো তোলা হয় না, আর ড্রেন সবসময় বন্ধ থাকে।'],
        },
    },
    'traffic': {
        'terse': ['traffic', 'traffic jam', 'parking', 'too much traffic'],
        'medium': [
            'Traffic is terrible, it takes me {hrs} hours to go to office and come back.',
            'There is no parking, people park on both sides and even an ambulance cannot enter.',
            'The main road is always jammed because of the metro work.',
            'Two-wheelers drive on the footpath, so walking is dangerous for old people.',
            'Autos and buses stop anywhere and the whole junction gets blocked.',
            'Every house has two cars now but the lanes are the same width as thirty years ago.',
            'Potholes and traffic together make the daily commute a nightmare.',
        ],
        'extra': [
            'My son missed his exam once because the bus was stuck for an hour.',
            'There are fights over parking almost every week.',
            'The signal near the school has not worked for months.',
            'I spend more time on the road than with my family.',
        ],
        'mixed': [
            'Traffic ka koi solution nahi hai, office jaane mein hi do ghante lag jaate hai.',
            'Parking nie roj jhogra hoy.',
            'Signal pe hi aadha din nikal jaata hai, yaar.',
        ],
        'native': {
            'hi': ['ट्रैफिक और पार्किंग की बहुत समस्या है।'],
        },
    },
    'safety': {
        'terse': ['safety for women', 'not safe at night', 'safety', 'eve teasing'],
        'medium': [
            'It is not safe for women to walk alone after dark here.',
            'Boys sit near the paan shop at night and pass comments on girls.',
            'I do not let my daughter come home alone after seven in the evening.',
            'There have been chain snatching incidents near the bus stop.',
            'Men drink openly near the empty plot and women avoid that road.',
            'Safety at night is the biggest issue, especially for working women coming back late.',
            'Police patrolling is almost nil after ten at night.',
            'The lane to the station is dark and lonely, I always call someone while walking.',
        ],
        'extra': [
            'Last {month} a girl from our building was followed home.',
            'I have started taking an auto even for a short distance.',
            'My husband has to come to the bus stop to pick me up.',
            'We asked for a police booth but nothing happened.',
            'Even in daytime some stretches feel unsafe.',
        ],
        'mixed': [
            'Raat ko ladkiyon ke liye bilkul safe nahi hai.',
            'Raate eka pheray bhoy lage, rasta ekdom andhokar.',
            'Ladke log comment pass karte hai, isliye evening ke baad bahar nahi jaati.',
        ],
        'native': {
            'hi': ['रात को लड़कियों के लिए सुरक्षित नहीं है, डर लगता है।'],
            'bn': ['রাতে মেয়েদের একা ফিরতে ভয় লাগে।'],
        },
    },
    'rent': {
        'terse': ['high rent', 'rising rents', 'housing', 'rent too high'],
        'medium': [
            'Rents are going up every year and the landlord asks for {rs} rupees more each time.',
            'Old houses are being demolished for flats and people like us are being pushed out.',
            'Landlords do not rent to bachelors or to people from other states.',
            'The deposit they ask is ten months of rent, which ordinary people cannot pay.',
            'We have moved three times in {yrs} years because of rent increases.',
            'Housing is too expensive, young couples cannot afford to live near their parents.',
            'Builders are taking over every open plot and prices are only for rich people.',
            'There is always the fear of eviction because nobody has a proper agreement.',
        ],
        'extra': [
            'Half my salary goes on rent.',
            'Our landlord gave us one month notice to vacate.',
            'Many families who lived here for decades have left for the outskirts.',
            'The broker takes one month rent as commission.',
        ],
        'mixed': [
            'Kiraya har saal badh jaata hai, salary utni nahi badhti.',
            'Bhara ekhon ato beshi je para chhere jete hocche.',
            'Rent itna high hai ki PG mein adjust karna padta hai.',
        ],
        'native': {
            'hi': ['किराया हर साल बढ़ जाता है।'],
        },
    },
    'flooding': {
        'terse': ['waterlogging', 'flooding in monsoon', 'monsoon flooding', 'water logging'],
        'medium': [
            'During the monsoon the whole road goes under knee-deep water.',
            'Water enters the ground floor houses every rainy season.',
            'Even one hour of heavy rain and the lane is flooded for two days.',
            'Waterlogging in monsoon is the biggest problem, children cannot go to school.',
            'In {month} the water came up to our doorstep and ruined the furniture.',
            'The low-lying part of the {nb} floods every year and nobody plans for it.',
            'Rain water has nowhere to go because all the ponds were filled up for buildings.',
        ],
        'extra': [
            'We keep our things on bricks and the top shelf all monsoon.',
            'Snakes and dirty water come inside the house.',
            'Office people cannot go to work and daily wage workers lose income.',
            'The {corp} pumps come only after the water has already gone down.',
        ],
        'mixed': [
            'Borshay rastay jol jome jay, hatu obdhi jol.',
            'Baarish mein poora area paani mein doob jaata hai.',
            'Monsoon aate hi ghar mein paani ghus jaata hai.',
        ],
        'native': {
            'bn': ['বর্ষায় রাস্তায় জল জমে যায়, অফিস যেতে খুব অসুবিধা হয়।',
                   'একটু বৃষ্টি হলেই গলিতে হাঁটু জল।'],
            'hi': ['बारिश में पूरी गली में पानी भर जाता है।'],
            'ta': ['மழைக்காலத்தில் தெருவில் தண்ணீர் தேங்குகிறது.'],
        },
    },
    'parks': {
        'terse': ['no parks', 'no playground', 'no open space'],
        'medium': [
            'There is no park or playground, children play on the road.',
            'The only open ground was taken for a parking lot.',
            'Old people have nowhere to walk in the evening.',
            'The park we have is locked most of the time and full of weeds.',
            'Kids are stuck indoors on phones because there is no place to play.',
            'We need green space, every inch has been built over.',
        ],
        'extra': [
            'When I was young we played cricket in the field that is now a mall.',
            'My grandchildren play in the corridor of the building.',
            'The one park is used by people to drink at night.',
        ],
        'mixed': [
            'Bachchon ke khelne ke liye koi ground nahi hai.',
            'Khelar math nei, bachchara rastay khele.',
        ],
        'native': {
            'bn': ['ছোটদের খেলার মাঠ নেই।'],
        },
    },
    'youth_jobs': {
        'terse': ['unemployment', 'no jobs for youth', 'youth unemployment'],
        'medium': [
            'Young boys are sitting idle with degrees and no jobs.',
            'There is no work nearby, the youth have to go to other states.',
            'Unemployment among young people is the main problem, it leads to drinking and fights.',
            'Graduates are doing delivery jobs because nothing else is available.',
            'Factories around here have closed, so there is no local employment.',
            'Educated girls sit at home because there are no suitable jobs.',
        ],
        'extra': [
            'My nephew has been preparing for government exams for {yrs} years.',
            'Many boys from the {nb} have gone to Bengaluru or the Gulf.',
            'Some of them fall into bad company.',
        ],
        'mixed': [
            'Chhele-meyeder kaaj nei, sob bose ache.',
            'Naukri nahi hai, ladke log bas ghoomte rehte hai.',
        ],
        'native': {
            'hi': ['नौजवानों के लिए कोई काम नहीं है।'],
            'bn': ['পাড়ার ছেলেদের হাতে কোনো কাজ নেই।'],
        },
    },
    'noise': {
        'terse': ['noise', 'noise pollution', 'loudspeakers'],
        'medium': [
            'Loudspeakers during every function and procession, nobody can sleep.',
            'Construction noise goes on day and night.',
            'Constant honking, the noise is too much for elderly people.',
            'The marriage hall next door plays music till two in the morning.',
        ],
        'extra': [
            'My father has high blood pressure and the noise makes it worse.',
            'Students cannot study during exam time.',
        ],
        'mixed': [
            'Shor bahut hai, raat ko bhi DJ bajta hai.',
        ],
        'native': {},
    },
    'streetlights': {
        'terse': ['streetlights', 'no street lights', 'dark roads'],
        'medium': [
            'Most of the streetlights do not work, the lane is completely dark at night.',
            'The streetlight in front of our house has been broken for {yrs} years.',
            'Poor lighting on the approach road makes it scary after sunset.',
            'Lights are there on the main road but not in the inner lanes.',
        ],
        'extra': [
            'We complained on the {corp} app but the complaint just closed by itself.',
            'People use their phone torch to walk home.',
        ],
        'mixed': [
            'Street light kharab hai, raat ko andhera rehta hai.',
            'Rastar alo jole na, sondhyer por ekdom andhokar.',
        ],
        'native': {
            'bn': ['রাতে রাস্তায় আলো নেই।'],
            'hi': ['गली की बत्तियाँ महीनों से खराब हैं।'],
        },
    },
    'air': {
        'terse': ['air pollution', 'pollution', 'smog', 'dust'],
        'medium': [
            'Air pollution is very bad, in winter you cannot even see the next building.',
            'The dust from construction is everywhere, everyone has a cough.',
            'Smoke from burning garbage makes breathing difficult in the evening.',
            'Pollution is the biggest issue, the children have asthma.',
            'Diesel trucks pass all night and the air is black.',
        ],
        'extra': [
            'Schools were shut for a week in November because of the smog.',
            'We bought an air purifier but it is only for one room.',
            'My mother uses an inhaler now.',
        ],
        'mixed': [
            'Pollution itna hai ki saans lena mushkil hai.',
            'Dhulo aar dhonwa, sobar kashi.',
        ],
        'native': {
            'hi': ['प्रदूषण बहुत ज़्यादा है, सर्दियों में साँस लेना मुश्किल है।'],
        },
    },
    'drainage': {
        'terse': ['drainage', 'blocked drains', 'open drains'],
        'medium': [
            'The drains are open and always blocked, the sewage overflows onto the road.',
            'There is no proper sewer line, the waste water stands in the lane.',
            'The nala behind our houses has not been cleaned for years.',
            'Drainage is so bad that the lane smells all year round.',
            'Dirty drain water mixes with the drinking water pipe.',
        ],
        'extra': [
            'Mosquitoes are a big problem because of the stagnant water.',
            'Children fall sick often with stomach problems.',
            'The {corp} cleans it once before elections and forgets.',
        ],
        'mixed': [
            'Nali hamesha choke rehti hai.',
            'Drain-er jol rastay uthe ase.',
        ],
        'native': {
            'hi': ['नालियाँ हमेशा बंद रहती हैं, गंदा पानी सड़क पर आ जाता है।'],
        },
    },
    'events': {
        'terse': ['no community events', 'no togetherness'],
        'medium': [
            'There are no community programmes any more, people just stay inside their flats.',
            'Earlier we celebrated festivals together, now everyone is busy.',
            'Nobody organises anything for the {nb}, so we do not know our neighbours.',
            'There is no community hall or common place where people can meet.',
        ],
        'extra': [
            'Our building has sixty flats and I know maybe five families.',
            'The puja committee is now run by a few people only.',
        ],
        'mixed': [
            'Pehle sab milke festival manate the, ab koi kisi ko nahi jaanta.',
            'Ager moto adda ar hoy na.',
        ],
        'native': {},
    },
    'newcomers': {
        'terse': ['outsiders vs locals', 'no trust among neighbours'],
        'medium': [
            'There is distrust between the old residents and the new people who have come to rent.',
            'Old residents look at us as outsiders even after {yrs} years.',
            'New flats have brought people who do not mix with anyone in the {nb}.',
            'People are suspicious of tenants, they call them outsiders.',
            'The locals and the migrants do not talk, there is always some tension.',
            'Language is a barrier, the older families do not accept people who do not speak the local language.',
        ],
        'extra': [
            'When something is stolen they immediately blame the tenants.',
            'The residents association meetings are only for owners.',
            'My landlord asked for my native place and caste before anything else.',
        ],
        'mixed': [
            'Local log outsider bolke alag treat karte hai.',
            'Notun lokera karo sathe mesh na.',
        ],
        'native': {
            'bn': ['নতুন ভাড়াটেদের সাথে পুরোনো বাসিন্দাদের তেমন আলাপ নেই।'],
        },
    },
    'corruption': {
        'terse': ['corruption', 'bribery', 'no accountability'],
        'medium': [
            'Nothing gets done in the {corp} office without paying a bribe.',
            'Corruption in local services, the councillor only helps his own people.',
            'Road repair money is eaten up, the same road is dug up every year.',
            'You need a middleman even to get a birth certificate.',
            'The local officials take money and ignore complaints.',
            'Contracts go to relatives of the party people.',
        ],
        'extra': [
            'I had to pay {rs} rupees just to get my water connection file moved.',
            'Before elections they come with folded hands, after that you never see them.',
            'Honest people get tired and give up.',
        ],
        'mixed': [
            'Bina paise ke koi kaam nahi hota.',
            'Sob jaigay ghush dite hoy, dada dhorte hoy.',
        ],
        'native': {
            'hi': ['नगर निगम वाले बिना पैसे के कोई काम नहीं करते।'],
        },
    },
}

# ---------------------------------------------------------------------------
# Q: What would make you feel more connected to your community?
# ---------------------------------------------------------------------------

CONNECT = {
    'festivals': {
        'terse': ['festivals together', 'more community events', 'cultural programmes'],
        'medium': [
            'If we celebrated festivals together as one {nb} instead of separately.',
            'More cultural programmes where families can come together.',
            'A common puja or utsav where everyone contributes, not only the committee.',
            'Sports day or a small fair for the children would bring people out of their homes.',
            'Regular get-togethers, even a monthly potluck would help.',
            'Celebrating each other\'s festivals, Eid, Diwali, Christmas, Pongal, all of them.',
            'Community events on weekends when working people are free.',
        ],
        'extra': [
            'During the pandemic we cooked for each other and it felt like one family.',
            'When I was a child the whole {nb} would sit together for the puja bhog.',
            'People only meet at weddings and funerals now.',
        ],
        'mixed': [
            'Sab milke tyohar manaye toh accha lagega.',
            'Parar pujoy sobai mile kaaj korle bhalo lage.',
            'Festival time pe sabko invite karna chahiye, sirf apne logon ko nahi.',
        ],
        'native': {
            'hi': ['मोहल्ले में त्योहार मिलकर मनाएँ तो अच्छा लगेगा।'],
            'bn': ['পাড়ার পুজোয় সবাই মিলে কাজ করলে আরও কাছের মনে হয়।'],
            'ta': ['எல்லோரும் சேர்ந்து பொங்கல் கொண்டாடினால் நன்றாக இருக்கும்.'],
        },
    },
    'meetings': {
        'terse': ['open RWA meetings', 'residents meetings'],
        'medium': [
            'If the residents welfare association included tenants and not only owners.',
            'Regular meetings where ordinary people can raise problems and actually be heard.',
            'A ward committee that meets every month and shares what the {corp} is doing.',
            'The association should be run democratically, not by the same two families.',
            'If women were also invited to the meetings and made office bearers.',
        ],
        'extra': [
            'Right now decisions are taken and we are just told to pay.',
            'I went once but nobody listened to what I said.',
        ],
        'mixed': [
            'Meeting mein sabki baat suni jaaye toh accha hai.',
            'Samiti-te bharatiyader o dake na, sudhu malik ra.',
        ],
        'native': {},
    },
    'spaces': {
        'terse': ['a park', 'common space', 'community hall'],
        'medium': [
            'A park or common place where people can sit and talk in the evening.',
            'A community hall that anybody can use for functions without paying a lot.',
            'A small library or reading room where young and old can meet.',
            'A proper playground, the children will play together and the parents will also meet.',
            'Benches and a walking track, that is where you actually meet neighbours.',
        ],
        'extra': [
            'The tea stall is the only place where people chat now.',
            'In the old days the rowak outside the houses was where everybody met.',
        ],
        'mixed': [
            'Ek park ho jahan log baith ke baat kar sakein.',
            'Ekta boshar jaiga thakle adda hoto.',
        ],
        'native': {
            'bn': ['একটা মাঠ বা বসার জায়গা থাকলে সবাই মিশতে পারত।'],
        },
    },
    'safer_streets': {
        'terse': ['safer streets', 'better lighting', 'safety'],
        'medium': [
            'If the streets were safe to walk at night I would go out and meet people more.',
            'Better streetlights and some police presence, then women can also take part.',
            'Safe public transport so that I can attend things in the evening.',
            'CCTV and a local help desk would make people feel secure to step out.',
        ],
        'extra': [
            'Right now I rush home before dark, so I miss everything.',
            'My mother will only let me go if my brother comes along.',
        ],
        'mixed': [
            'Safe ho toh evening mein bhi bahar jaa sakte hai.',
            'Raste alo thakle bhoy kom lagto.',
        ],
        'native': {
            'hi': ['रास्ते सुरक्षित हों तो शाम को भी बाहर निकल सकते हैं।'],
        },
    },
    'neighbours': {
        'terse': ['knowing neighbours', 'friendly neighbours', 'more trust'],
        'medium': [
            'Just knowing the names of my neighbours would be a start.',
            'If people were more welcoming to newcomers instead of asking which caste or state we are from.',
            'Neighbours helping each other in emergencies, like it used to be.',
            'Some kind of welcome for new families, somebody to show them around.',
            'More trust between people, now everyone keeps to themselves.',
            'If people greeted each other and stopped judging tenants.',
        ],
        'extra': [
            'When my father was in hospital not a single neighbour asked.',
            'In my village everyone knows everyone, here I feel like a stranger.',
            'My neighbour aunty sends food sometimes and that is the only connection I have.',
        ],
        'mixed': [
            'Padosi log thoda help karein, bas itna chahiye.',
            'Pashe ke thake seta jantei parina.',
            'Log thoda friendly ho jaayein toh apnapan lagega.',
        ],
        'native': {
            'hi': ['पड़ोसी एक-दूसरे का हाल पूछें तो अपनापन लगेगा।'],
            'bn': ['প্রতিবেশীরা একটু খোঁজখবর নিলে ভালো লাগত।'],
        },
    },
    'language': {
        'terse': ['language acceptance', 'learning the local language'],
        'medium': [
            'If people accepted us even though we do not speak the local language well.',
            'Free classes to learn the local language would help migrants like me mix better.',
            'People should not make fun of our accent or our food.',
            'Some programme where locals and outsiders can meet, not just live side by side.',
        ],
        'extra': [
            'I am trying to learn, I can say a few words now.',
            'My children speak it better than me and they have local friends.',
        ],
        'mixed': [
            'Swalpa adjust maadi, bas thoda sa respect chahiye.',
            'Bhasha nahi aati toh log alag hi dekhte hai.',
        ],
        'native': {},
    },
    'municipal': {
        'terse': ['responsive councillor', 'better services', 'working {corp}'],
        'medium': [
            'If the {corp} actually responded to complaints I would feel this place is mine.',
            'A councillor who comes and listens, not only during elections.',
            'Basic services working properly, water, roads and lights, then people have time for each other.',
            'Transparency in how ward funds are spent, maybe a notice board.',
            'A local office where you can go without a middleman.',
        ],
        'extra': [
            'Most of our energy goes in fighting for basic things.',
            'Participatory budgeting like some cities have tried would be good.',
        ],
        'mixed': [
            'Councillor saab kabhi aate hi nahi.',
            'Corporation kaaj korle loke bharsa pabe.',
        ],
        'native': {
            'hi': ['नगर निगम शिकायत सुने तो भरोसा बनेगा।'],
        },
    },
    'youth': {
        'terse': ['youth club', 'sports for kids'],
        'medium': [
            'A youth club with sports and computer classes to keep the boys busy.',
            'Football or cricket tournaments between lanes, the young people would connect.',
            'Coaching or skill training centre for the young people of the {nb}.',
            'Something for teenagers to do in the evening other than sitting on the phone.',
        ],
        'extra': [
            'Our club used to run a library but it closed after the old members died.',
        ],
        'mixed': [
            'Bachcho ke liye koi club ya ground ho.',
            'Club-e aabar khela shuru hole bhalo hoy.',
        ],
        'native': {},
    },
    'women': {
        'terse': ['women\'s group', 'self-help group'],
        'medium': [
            'A women\'s group or self-help group where we can meet and also earn something.',
            'Mahila mandal meetings in the afternoon when we are free from housework.',
            'A place where women can come together without needing permission from anyone.',
            'Classes for tailoring or computers for women, we would get to know each other.',
        ],
        'extra': [
            'Our self-help group gave me friends and some savings.',
            'Most women here only meet at the water tap.',
        ],
        'mixed': [
            'Aurton ke liye koi group ho toh milna-julna hoga.',
            'Mahila samiti thakle meyera ekjot hote parto.',
        ],
        'native': {
            'hi': ['महिलाओं के लिए कोई समूह हो तो मिलना-जुलना होगा।'],
        },
    },
    'seniors': {
        'terse': ['senior citizens club'],
        'medium': [
            'A senior citizens\' corner where old people can sit together in the morning.',
            'Someone to check on elderly people who live alone.',
            'A laughter club or a bhajan group for older people.',
        ],
        'extra': [
            'All our children are abroad or in other cities, we are alone.',
        ],
        'mixed': [
            'Buro-der jonno ekta boshar ghor thakle bhalo hoto.',
        ],
        'native': {
            'bn': ['বয়স্কদের জন্য একটা বসার জায়গা চাই।'],
        },
    },
    'online': {
        'terse': ['WhatsApp group', 'online group'],
        'medium': [
            'A proper WhatsApp group for the {nb} where information is shared, not only forwards.',
            'An app or group where we can report problems together and follow up.',
            'Our building WhatsApp group helped during the floods, one for the whole area would be useful.',
        ],
        'extra': [
            'Right now the group is only used for complaints about parking.',
        ],
        'mixed': [
            'Area ka ek WhatsApp group ho, sab updated rahenge.',
        ],
        'native': {},
    },
    'time': {
        'terse': ['more free time', 'shorter commute'],
        'medium': [
            'Honestly, more time. I leave at seven and come back at ten, there is no time to connect.',
            'If working hours were normal I would join things, now I am always tired.',
            'Shorter travel to work, then weekends would not be only for rest.',
        ],
        'extra': [
            'Sunday is the only day and that goes in household work.',
        ],
        'mixed': [
            'Time hi nahi milta, office aur ghar mein hi din khatam.',
        ],
        'native': {},
    },
    'cleanliness': {
        'terse': ['cleanliness drive', 'clean surroundings'],
        'medium': [
            'A cleanliness drive where everyone participates, owners and tenants together.',
            'If we planted trees together and looked after them as a group.',
            'Working together on something practical like cleaning the drain would build trust.',
        ],
        'extra': [
            'Once we cleaned the pond together and people still talk about that day.',
        ],
        'mixed': [
            'Sab milke safai karein toh apna area lagega.',
        ],
        'native': {},
    },
    'harmony': {
        'terse': ['communal harmony', 'no discrimination'],
        'medium': [
            'Less division by religion and caste, we were never like this before.',
            'If people stopped discriminating and treated everyone equally.',
            'Political parties should stop dividing the {nb} for votes.',
            'Respect for all communities, the young people are being poisoned by social media.',
        ],
        'extra': [
            'My best friend growing up was from a different community and nobody minded.',
            'Now even the tea stall conversations have become tense.',
        ],
        'mixed': [
            'Hindu Muslim sab ek saath rahein, bas yahi chahiye.',
            'Jaat-paat chhod ke sabko barabar dekhna chahiye.',
        ],
        'native': {
            'hi': ['सब धर्म के लोग मिलकर रहें, यही चाहिए।'],
        },
    },
    'housing': {
        'terse': ['secure housing', 'own house', 'stable rent'],
        'medium': [
            'If I knew I could stay here for more than a year, I would invest in knowing people.',
            'Owning a house, even a small one. As a tenant you always feel temporary.',
            'Fair rent agreements so that we are not thrown out suddenly.',
            'Affordable housing near work so that families can settle in one place.',
        ],
        'extra': [
            'We have shifted so many times that my children stopped making friends.',
            'Tenants are never seen as real members of the {nb}.',
        ],
        'mixed': [
            'Apna ghar ho toh apnapan aata hai, kiraye mein nahi.',
            'Nijer bari na thakle para-ke nijer mone hoy na.',
        ],
        'native': {
            'hi': ['अपना घर हो तो अपनापन आता है।'],
        },
    },
}

OPENERS = [
    'Honestly,', 'Mainly', 'I think', 'According to me,', 'Frankly speaking,', 'For me,', 'See,',
    'Basically', 'Most important is', 'Biggest thing is', 'To be honest,', 'Actually',
]
CONNECTORS = ['Also', 'Apart from that,', 'And', 'Along with that,', 'Another thing is', 'Plus', 'On top of that,', 'Second thing,']
CLOSERS = [
    'Nobody cares.', 'That is all.', 'Something should be done.', 'It has become worse in the last few years.',
    'Hope this survey helps.', 'We are fed up.', 'It is the same story every year.',
    'Otherwise it is a nice place to live.', 'The rest is okay.', 'Please do something about it.',
]
CONNECT_CLOSERS = [
    'That would make a big difference.', 'Then it would feel like home.', 'That is what I feel.',
    'It is not difficult, someone just has to start.', 'Then people would trust each other more.',
    'Otherwise everyone is in their own world.',
]

BLANK_CHALLENGE = ['', '', "Don't know", "don't know", 'Nothing', 'No problem as such', 'nothing much', 'Cannot say', 'NA']
BLANK_CONNECT = ['', '', "Don't know", 'Nothing', 'I already feel connected', 'Not interested', 'Cannot say', 'nothing really', 'NA']

NB_WORDS = {
    1: ['para', 'locality', 'area', 'para'],
    2: ['colony', 'mohalla', 'block', 'area'],
    3: ['society', 'building', 'chawl', 'area'],
    4: ['layout', 'area', 'apartment complex', 'locality'],
    5: ['street', 'nagar', 'area', 'colony'],
}
CORP = {
    1: ['KMC', 'Corporation', 'municipality'],
    2: ['MCD', 'Corporation', 'municipal office'],
    3: ['BMC', 'municipal ward office', 'Corporation'],
    4: ['BBMP', 'Corporation', 'ward office'],
    5: ['Corporation', 'GCC', 'ward office'],
}
CORP_PERI = ['panchayat', 'municipality', 'local body', 'panchayat office']
MONTHS = ['May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'April']
