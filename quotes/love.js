const loveQuotes = [
  {
    text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.",
    author: "Lao Tzu"
  },
  {
    text: "The best thing to hold onto in life is each other.",
    author: "Audrey Hepburn"
  },
  {
    text: "Love is composed of a single soul inhabiting two bodies.",
    author: "Aristotle"
  },
  {
    text: "Where there is love there is life.",
    author: "Mahatma Gandhi"
  },
  {
    text: "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.",
    author: "Unknown"
  },
  {
    text: "Love is when the other person's happiness is more important than your own.",
    author: "H. Jackson Brown Jr."
  },
  {
    text: "To love and be loved is to feel the sun from both sides.",
    author: "David Viscott"
  },
  {
    text: "Love recognizes no barriers. It jumps hurdles, leaps fences, penetrates walls to arrive at its destination full of hope.",
    author: "Maya Angelou"
  },
  {
    text: "You know it's love when all you want is that person to be happy, even if you're not part of their happiness.",
    author: "Julia Roberts"
  },
  {
    text: "In the end, we discover that to love and let go can be the same thing.",
    author: "Jack Kornfield"
  },
  {
    text: "Love is the whole thing. We are only the pieces.",
    author: "Rumi"
  },
  {
    text: "To love is nothing. To be loved is something. But to love and be loved, that's everything.",
    author: "T. Tolis"
  },
  {
    text: "Love is a friendship set to music.",
    author: "Joseph Campbell"
  },
  {
    text: "We are shaped and fashioned by what we love.",
    author: "Johann Wolfgang von Goethe"
  },
  {
    text: "The giving of love is an education in itself.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "There is only one happiness in this life, to love and be loved.",
    author: "George Sand"
  },
  {
    text: "Love cures people—both the ones who give it and the ones who receive it.",
    author: "Karl Menninger"
  },
  {
    text: "Love is the only thing that transcends time and space.",
    author: "Marcel Proust"
  },
  {
    text: "One word frees us of all the weight and pain of life: That word is love.",
    author: "Sophocles"
  },
  {
    text: "The loneliest place in the world is the human heart when love is absent.",
    author: "Jeremiah Say"
  },
  {
    text: "Duty makes us do things well, but love makes us do them beautifully.",
    author: "Phillips Brooks"
  },
  {
    text: "Love is not affectionate feeling, but a steady wish for the loved person's ultimate good as far as it can be obtained.",
    author: "C. S. Lewis"
  },
  {
    text: "First and foremost, self-love, and then give love away.",
    author: "Katy Perry"
  },
  {
    text: "Jealousy, properly considered, is an essential element of true love: it is an unceasing longing for the loved one's welfare.",
    author: "J. A. Motyer"
  },
  {
    text: "Love is service rather than sentiment.",
    author: "John R. W. Stott"
  },
  {
    text: "Love is the outgoing of the entire nature in self-sacrificing service.",
    author: "W. H. Griffith Thomas"
  },
  {
    text: "If you work at love, you will find love at work.",
    author: "Peter Jackson"
  },
  {
    text: "You can give without loving, but you cannot love without giving.",
    author: "Amy Carmichael"
  },
  {
    text: "Nothing will be intentionally lacking where there is love.",
    author: "J. C. Ryle"
  },
  {
    text: "He who is not filled with love is necessarily small, withered, shrivelled in his outlook on life and things.",
    author: "Benjamin B. Warfield"
  },
  {
    text: "Love is like a friendship caught on fire. In the beginning a flame, very pretty, often hot and fierce, but still only light and flickering. As love grows older, our hearts mature and our love becomes as coals, deep-burning and unquenchable.",
    author: "Bruce Lee"
  },
  {
    text: "There is no charm equal to tenderness of heart.",
    author: "Jane Austen"
  },
  {
    text: "You always gain by giving love.",
    author: "Reese Witherspoon"
  },
  {
    text: "The greatest healing therapy is friendship and love.",
    author: "Hubert H. Humphrey"
  },
  {
    text: "Love takes off masks that we fear we cannot live without and know we cannot live within.",
    author: "James Baldwin"
  },
  {
    text: "The best and most beautiful things in this world cannot be seen or even heard, but must be felt with the heart.",
    author: "Helen Keller"
  },
  {
    text: "Alone we can do so little; together we can do so much.",
    author: "Helen Keller"
  },
  {
    text: "To be brave is to love someone unconditionally, without expecting anything in return.",
    author: "Madonna"
  },
  {
    text: "I love you begins by I, but it ends up by you.",
    author: "Charles de Leusse"
  },
  {
    text: "Love is that condition in which the happiness of another person is essential to your own.",
    author: "Robert A. Heinlein"
  },
  {
    text: "You don't marry someone you can live with — you marry someone you cannot live without.",
    author: "Anon."
  },
  {
    text: "Walk with me through life…and I'll have everything I'll need for the journey.",
    author: "Anon."
  },
  {
    text: "You have replaced my nightmares with dreams, my worries with happiness, and my fears with love.",
    author: "Anon."
  },
  {
    text: "You know you're in love when you can't fall asleep because the reality is finally better than your dreams.",
    author: "Dr. Seuss"
  },
  {
    text: "To the world, you may be one person, but to one person you are the world.",
    author: "Dr. Seuss"
  },
  {
    text: "Love and compassion are necessities, not luxuries. Without them humanity cannot survive.",
    author: "Dalai Lama"
  },
  {
    text: "'Tis better to have loved and lost, than never to have loved at all.",
    author: "Alfred, Lord Tennyson"
  },
  {
    text: "Two people in love, alone, isolated from the world, that's beautiful.",
    author: "Milan Kundera"
  },
  {
    text: "The greatest happiness of life is the conviction that we are loved; loved for ourselves, or rather, loved in spite of ourselves.",
    author: "Victor Hugo"
  },
  {
    text: "I think the perfection of love is that it's not perfect.",
    author: "Taylor Swift"
  },
  {
    text: "Love does not dominate; it cultivates.",
    author: "Johann Wolfgang von Goethe"
  },
  {
    text: "To love or have loved, that is enough. Ask nothing further. There is no other pearl to be found in the dark folds of life.",
    author: "Victor Hugo"
  },
  {
    text: "If you live to be a hundred, I want to live to be a hundred minus one day, so I never have to live without you.",
    author: "Winnie the Pooh"
  },
  {
    text: "Affection is responsible for nine-tenths of whatever solid and durable happiness there is in our lives.",
    author: "C.S. Lewis"
  },
  {
    text: "To lose balance sometimes for love is part of living a balanced life.",
    author: "Elizabeth Gilbert"
  },
  {
    text: "Love never dies a natural death. It dies because we don't know how to replenish its source. It dies of blindness and errors and betrayals. It dies of illness and wounds; it dies of weariness, of witherings, of tarnishings.",
    author: "Anaïs Nin"
  },
  {
    text: "I have found the paradox, that if you love until it hurts, there can be no more hurt, only more love.",
    author: "Mother Teresa"
  },
  {
    text: "The hunger for love is much more difficult to remove than the hunger for bread.",
    author: "Mother Teresa"
  },
  {
    text: "When we love, we always strive to become better than we are. When we strive to become better than we are, everything around us becomes better too.",
    author: "Paulo Coelho"
  },
  {
    text: "Love is an untamed force. When we try to control it, it destroys us. When we try to imprison it, it enslaves us. When we try to understand it, it leaves us feeling lost and confused.",
    author: "Paulo Coelho"
  },
  {
    text: "It is better to be hated for what you are than to be loved for what you are not.",
    author: "Andre Gide"
  },
  {
    text: "It is not a lack of love, but a lack of friendship that makes unhappy marriages.",
    author: "Friedrich Nietzsche"
  },
  {
    text: "Love is the flower; you've got to let it grow.",
    author: "John Lennon"
  },
  {
    text: "Love is what you've been through with somebody.",
    author: "James Thurber"
  },
  {
    text: "There's nothing that I wouldn't do to make you feel my love.",
    author: "Bob Dylan"
  },
  {
    text: "Love is of all passions the strongest, for it attacks simultaneously the head, the heart and the senses.",
    author: "Lao Tzu"
  },
  {
    text: "To fear love is to fear life, and those who fear life are already three parts dead.",
    author: "Bertrand Russell"
  },
  {
    text: "Maybe I don't know that much but I know this much is true, I was blessed because I was loved by you.",
    author: "Celine Dion"
  },
  {
    text: "A friend is someone who knows all about you and still loves you.",
    author: "Elbert Hubbard"
  },
  {
    text: "When I despair, I remember that all through history the way of truth and love have always won. There have been tyrants and murderers, and for a time, they can seem invincible, but in the end, they always fall. Think of it--always.",
    author: "Mahatma Gandhi"
  },
  {
    text: "It takes courage to love, but pain through love is the purifying fire which those who love generously know. We all know people who are so much afraid of pain that they shut themselves up like clams in a shell and, giving out nothing, receive nothing and therefore shrink until life is a mere living death.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "I love how she makes me feel like anything is possible, or like life is worth it.",
    author: "Tom Hansen"
  },
  {
    text: "Once in a while, right in the middle of an ordinary life, love gives us a fairy tale.",
    author: "Melissa Brown"
  },
  {
    text: "The most important thing in life is to learn how to give out love, and to let it come in.",
    author: "Morrie Schwartz"
  },
  {
    text: "I love being married. It's so great to find one special person you want to annoy for the rest of your life.",
    author: "Rita Rudner"
  },
  {
    text: "When you realize you want to spend the rest of your life with somebody, you want the rest of your life to start as soon as possible.",
    author: "Anon."
  },
  {
    text: "Every person has to love at least one bad partner in their lives to be truly thankful for the right one.",
    author: "Anon."
  },
  {
    text: "I'm selfish, impatient and a little insecure. I make mistakes, I am out of control and at times hard to handle. But if you can't handle me at my worst, then you sure as hell don't deserve me at my best.",
    author: "Marilyn Monroe"
  },
  {
    text: "Lots of people want to ride with you in the limo, but what you want is someone who will take the bus with you when the limo breaks down.",
    author: "Oprah Winfrey"
  },
  {
    text: "Love many things, for therein lies the true strength, and whosoever loves much performs much, and can accomplish much, and what is done in love is done well.",
    author: "Vincent Van Gogh"
  },
  {
    text: "You don't love someone because they're perfect, you love them in spite of the fact that they're not.",
    author: "Jodi Picoult"
  },
  {
    text: "When you love someone, you love the person as they are, and not as you'd like them to be.",
    author: "Leo Tolstoy"
  },
  {
    text: "We are never so defenseless against suffering as when we love.",
    author: "Sigmund Freud"
  },
  {
    text: "Love is needing someone. Love is putting up with someone's bad qualities because they somehow complete you.",
    author: "Sarah Dessen"
  },
  {
    text: "Love... it surrounds every being and extends slowly to embrace all that shall be.",
    author: "Khalil Gibran"
  },
  {
    text: "Love is not only something you feel, it is something you do.",
    author: "David Wilkerson"
  },
  {
    text: "The only thing we never get enough of is love; and the only thing we never give enough of is love.",
    author: "Henry Miller"
  },
  {
    text: "Don't brood. Get on with living and loving. You don't have forever.",
    author: "Leo Buscaglia"
  },
  {
    text: "Every heart sings a song, incomplete, until another heart whispers back. Those who wish to sing always find a song. At the touch of a lover, everyone becomes a poet.",
    author: "Plato"
  },
  {
    text: "Sometimes it's a form of love just to talk to somebody that you have nothing in common with and still be fascinated by their presence.",
    author: "David Byrne"
  },
  {
    text: "I have decided to stick to love; hate is too great a burden to bear.",
    author: "Martin Luther King, Jr."
  },
  {
    text: "Darkness cannot drive out darkness: only light can do that. Hate cannot drive out hate: only love can do that.",
    author: "Martin Luther King, Jr."
  },
  {
    text: "When we are in love we seem to ourselves quite different from what we were before.",
    author: "Blaise Pascal"
  },
  {
    text: "The way to love anything is to realize that it may be lost.",
    author: "Gilbert K. Chesterton"
  },
  {
    text: "Friends show their love in times of trouble, not in happiness.",
    author: "Euripides"
  },
  {
    text: "I love you not because of who you are, but because of who I am when I am with you.",
    author: "Roy Croft"
  },
  {
    text: "Do I love you? My god, if your love were a grain of sand, mine would be a universe of beaches.",
    author: "William Goldman"
  },
  {
    text: "Love yourself first and everything else falls into line. You really have to love yourself to get anything done in this world.",
    author: "Lucille Ball"
  },
  {
    text: "When someone loves you, the way they talk about you is different. You feel safe and comfortable.",
    author: "Jess C. Scott"
  },
  {
    text: "Love is like the wind, you can't see it but you can feel it.",
    author: "Nicholas Sparks"
  },
  {
    text: "You don't love someone for their looks, or their clothes, or for their fancy car, but because they sing a song only you can hear.",
    author: "Oscar Wilde"
  },
  {
    text: "Keep love in your heart. A life without it is like a sunless garden when the flowers are dead.",
    author: "Oscar Wilde"
  },
  {
    text: "Never love anybody who treats you like you're ordinary.",
    author: "Oscar Wilde"
  },
  {
    text: "A lady's imagination is very rapid; it jumps from admiration to love, from love to matrimony in a moment.",
    author: "Jane Austen"
  },
  {
    text: "The love we have in our youth is superficial compared to the love that an old man has for his old wife.",
    author: "Will Durant"
  },
  {
    text: "You're always with yourself, so you might as well enjoy the company.",
    author: "Diane Von Furstenberg"
  },
  {
    text: "Love looks not with the eyes, but with the mind, And therefore is winged Cupid painted blind.",
    author: "William Shakespeare"
  },
  {
    text: "A new command I give you: Love one another. As I have loved you, so you must love one another.",
    author: "Jesus Christ"
  }
];

module.exports = loveQuotes; 