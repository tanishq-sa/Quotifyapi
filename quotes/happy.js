const happyQuotes = [
  {
    text: "Happiness is not something ready made. It comes from your own actions.",
    author: "Dalai Lama"
  },
  {
    text: "The purpose of our lives is to be happy.",
    author: "Dalai Lama"
  },
  {
    text: "Happiness is when what you think, what you say, and what you do are in harmony.",
    author: "Mahatma Gandhi"
  },
  {
    text: "Be happy for this moment. This moment is your life.",
    author: "Omar Khayyam"
  },
  {
    text: "Happiness is a choice, not a result. Nothing will make you happy until you choose to be happy.",
    author: "Ralph Marston"
  },
  {
    text: "The secret of happiness is not in doing what one likes, but in liking what one does.",
    author: "James M. Barrie"
  },
  {
    text: "Happiness is not by chance, but by choice.",
    author: "Jim Rohn"
  },
  {
    text: "The happiest people don't have the best of everything, they just make the best of everything.",
    author: "Unknown"
  },
  {
    text: "Happiness is only real when shared.",
    author: "Christopher McCandless"
  },
  {
    text: "Count your age by friends, not years. Count your life by smiles, not tears.",
    author: "John Lennon"
  },
  {
    text: "For every minute you are angry you lose sixty seconds of happiness.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "Happiness is not a goal... it's a by-product of a life well lived.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "The most important thing is to enjoy your life—to be happy—it's all that matters.",
    author: "Audrey Hepburn"
  },
  {
    text: "Happiness depends upon ourselves.",
    author: "Aristotle"
  },
  {
    text: "If you want to be happy, be.",
    author: "Leo Tolstoy"
  },
  {
    text: "Happiness is a warm puppy.",
    author: "Charles M. Schulz"
  },
  {
    text: "The key to being happy is knowing you have the power to choose what to accept and what to let go.",
    author: "Dodinsky"
  },
  {
    text: "Happiness is a choice. You can choose to be happy or choose to be miserable. The choice is yours.",
    author: "Unknown"
  },
  {
    text: "The only way to be truly happy is to do what you love.",
    author: "Unknown"
  },
  {
    text: "It's been my experience that you can nearly always enjoy things if you make up your mind firmly that you will.",
    author: "L.M. Montgomery"
  },
  {
    text: "Learn to value yourself, which means: fight for your happiness.",
    author: "Ayn Rand"
  },
  {
    text: "So we shall let the reader answer this question for himself: who is the happier man, he who has braved the storm of life and lived or he who has stayed securely on shore and merely existed?",
    author: "Hunter S. Thompson"
  },
  {
    text: "We all live with the objective of being happy; our lives are all different and yet the same.",
    author: "Anne Frank"
  },
  {
    text: "The happiness of your life depends upon the quality of your thoughts.",
    author: "Marcus Aurelius"
  },
  {
    text: "Top 15 Things Money Can't Buy: Time. Happiness. Inner Peace. Integrity. Love. Character. Manners. Health. Respect. Morals. Trust. Patience. Class. Common sense. Dignity.",
    author: "Roy T. Bennett"
  },
  {
    text: "Ah, what happiness it is to be with people who are all happy, to press hands, press cheeks, smile into eyes.",
    author: "Katherine Mansfield"
  },
  {
    text: "Later she remembered all the hours of the afternoon as happy -- one of those uneventful times that seem at the moment only a link between past and future pleasure, but turn out to have been the pleasure itself.",
    author: "F. Scott Fitzgerald"
  },
  {
    text: "I don't know what good it is to know so much and be smart as whips and all if it doesn't make you happy.",
    author: "J.D. Salinger"
  },
  {
    text: "We could never learn to be brave and patient, if there were only joy in the world.",
    author: "Helen Keller"
  },
  {
    text: "Joy is prayer; joy is strength: joy is love; joy is a net of love by which you can catch souls.",
    author: "Mother Teresa"
  },
  {
    text: "Happiness is the art of making a bouquet of those flowers within reach.",
    author: "Anon."
  },
  {
    text: "Happiness is the meaning and the purpose of life, the whole aim and end of human existence.",
    author: "Aristotle"
  },
  {
    text: "The foolish man seeks happiness in the distance, the wise grows it under his feet.",
    author: "J. Robert Oppenheimer"
  },
  {
    text: "True happiness is not attained through self-gratification, but through fidelity to a worthy purpose.",
    author: "Helen Keller"
  },
  {
    text: "If being happy is important to you, try this instead of regretting all you lack, celebrate all you've got.",
    author: "Brian Vaszily"
  },
  {
    text: "Man wishes to be happy even when he lives so as to make happiness impossible.",
    author: "Augustine"
  },
  {
    text: "The greatest happiness you can have is knowing that you do not necessarily require happiness.",
    author: "William Saroyan"
  },
  {
    text: "Being happy doesn't depend on any external conditions, it is governed by our mental attitude.",
    author: "Dale Carnegie"
  },
  {
    text: "Remember, happiness doesn't depend upon who you are or what you have, it depends solely upon what you think.",
    author: "Dale Carnegie"
  },
  {
    text: "It isn't what you have or who you are or where you are or what you are doing that makes you happy or unhappy. It is what you think about it.",
    author: "Dale Carnegie"
  },
  {
    text: "Happiness is not the end of life; character is.",
    author: "Henry Ward Beecher"
  },
  {
    text: "The best way to cheer yourself up is to try to cheer somebody else up.",
    author: "Mark Twain"
  },
  {
    text: "A man may be satisfied but not sanctified, contented but not converted, happy but not holy.",
    author: "John Blanchard"
  },
  {
    text: "There is only one happiness in life, to love and be loved.",
    author: "George Sand"
  },
  {
    text: "You will never be happy if you continue to search for happiness. You will never live if you are looking for the meaning of life.",
    author: "Albert Camus"
  },
  {
    text: "God, grant me the serenity to accept the things I cannot change, the courage to change the things I can, and the wisdom to know the difference.",
    author: "Reinhold Niebuhr"
  },
  {
    text: "The secret of happiness is not in doing what one likes, but in liking what one does.",
    author: "James Matthew Barrie"
  },
  {
    text: "A happy life depends on a good conscience.",
    author: "John Calvin"
  },
  {
    text: "Happiness is the secret to all beauty. There is no beauty without happiness.",
    author: "Christian Dior"
  },
  {
    text: "To live is the rarest thing in the world. Most people just exist.",
    author: "Oscar Wilde"
  },
  {
    text: "Happiness is not the absence of problems; but the ability to deal with them.",
    author: "Jack Brown"
  },
  {
    text: "Happiness is an attitude. We either make ourselves miserable, or happy or strong. The amount of work is the same.",
    author: "Francesca Reigler"
  },
  {
    text: "There can be no happiness if the things we believe in are different from the things we do.",
    author: "Treya Stark"
  },
  {
    text: "The secret of happiness is renunciation.",
    author: "Andrew Carnegie"
  },
  {
    text: "He who forgets the language of gratitude can never be on speaking terms with happiness.",
    author: "C. Neil Strait"
  },
  {
    text: "Only the development of compassion and understanding for others can bring us the tranquility and happiness we all seek.",
    author: "Dalai Lama XIV"
  },
  {
    text: "Spread love everywhere you go. Let no one ever come without leaving happier.",
    author: "Mother Teresa"
  },
  {
    text: "If you find serenity and happiness, some may be jealous. Be happy anyway.",
    author: "Mother Teresa"
  },
  {
    text: "In order to live free and happily, you must sacrifice boredom. It is not always an easy sacrifice.",
    author: "Richard Bach"
  },
  {
    text: "Happiness can be built only on virtue, and must of necessity have truth for its foundation.",
    author: "Samuel Taylor Coleridge"
  },
  {
    text: "A happy man is he that knows the world and cares not for it.",
    author: "Joseph Hall"
  },
  {
    text: "Until you make peace with who you are, you'll never be content with what you have.",
    author: "Doris Mortman"
  },
  {
    text: "The sexiest curve on your body is your smile. Flaunt it!",
    author: "Anon."
  },
  {
    text: "Happiness comes in waves. It'll find you again.",
    author: "Anon."
  },
  {
    text: "When you love what you have, you have everything you need.",
    author: "Anon."
  },
  {
    text: "Happiness is letting go of what you think your life is supposed to look like.",
    author: "Anon."
  },
  {
    text: "When it rains, look for rainbows. When it's dark, look for stars.",
    author: "Anon."
  },
  {
    text: "The search for happiness is one of the chief sources of unhappiness.",
    author: "Eric Hoffer"
  },
  {
    text: "Wise men and women in every major culture have maintained that the secret of happiness is not in getting more but in wanting less.",
    author: "Philip Slater"
  },
  {
    text: "The joyfulness of a man prolongeth his days.",
    author: "Proverbs 10:27"
  },
  {
    text: "Happy is he who learns to bear what he cannot change.",
    author: "Friedrich Schiller"
  },
  {
    text: "Every day is a new day, and you'll never be able to find happiness if you don't move on.",
    author: "Carrie Underwood"
  },
  {
    text: "Everyone wants to live on top of the mountain, but all the happiness and growth occurs while you're climbing it.",
    author: "Andy Rooney"
  },
  {
    text: "A good laugh makes any interview, or any conversation, so much better.",
    author: "Barbara Walters"
  },
  {
    text: "A calm and modest life brings more happiness than the pursuit of success combined with constant restlessness.",
    author: "Albert Einstein"
  },
  {
    text: "Sometimes life knocks you on your ass…get up, get up, get up!! Happiness is not the absence of problems. It's the ability to deal with them.",
    author: "Steve Maraboli"
  },
  {
    text: "Happiness is different from pleasure. Happiness has something to do with struggling, enduring, and accomplishing.",
    author: "George Sheehan"
  },
  {
    text: "When a man has lost all happiness, he's not alive. Call him a breathing corpse.",
    author: "Sophocles"
  },
  {
    text: "Most folks are as happy as they make up their minds to be.",
    author: "Abraham Lincoln"
  },
  {
    text: "Happiness is the spiritual experience of living every minute with love, grace and gratitude.",
    author: "Denis Waitley"
  },
  {
    text: "Action may not bring happiness but there is no happiness without action.",
    author: "William James"
  },
  {
    text: "There's nothing like deep breaths after laughing that hard. Nothing in the world like a sore stomach for the right reasons.",
    author: "Stephen Chbosky"
  },
  {
    text: "If you start to think the problem is 'out there,' stop yourself. That thought is the problem.",
    author: "Stephen Covey"
  },
  {
    text: "Think of all the beauty still left around you and be happy.",
    author: "Anne Frank"
  },
  {
    text: "We make a living by what we get, we make a life by what we give.",
    author: "Winston Churchill"
  },
  {
    text: "The power of finding beauty in the humblest things makes home happy and life lovely.",
    author: "Louisa May Alcott"
  },
  {
    text: "If you want happiness for an hour, take a nap. If you want happiness for a day, go fishing. If you want happiness for a year, inherit a fortune. If you want happiness for a lifetime, help someone else.",
    author: "Chinese Proverb"
  },
  {
    text: "Happiness grows at our own firesides, and is not to be picked in strangers' gardens.",
    author: "Douglas Jerrold"
  },
  {
    text: "Most people would rather be certain they're miserable, than risk being happy.",
    author: "Robert Anthony"
  },
  {
    text: "Happiness is a risk. If you're not a little scared, then you're not doing it right.",
    author: "Sarah Addison"
  },
  {
    text: "The end of life is not to be happy, nor to achieve pleasure and avoid pain, but to do the will of God, come what may.",
    author: "Martin Luther King"
  },
  {
    text: "The thing everyone should realize is that the key to happiness is being happy by yourself and for yourself.",
    author: "Ellen DeGeneres"
  },
  {
    text: "Happiness cannot be traveled to, owned, earned, worn or consumed. Happiness is the spiritual experience of living every minute with love, grace, and gratitude.",
    author: "Denis Waitley"
  },
  {
    text: "The only thing that will make you happy is being happy with who you are, and not who people think you are.",
    author: "Goldie Hawn"
  },
  {
    text: "Let us be grateful to the people who make us happy; they are the charming gardeners who make our souls blossom.",
    author: "Marcel Proust"
  },
  {
    text: "True happiness ne'er entered at an eye; true happiness resides in things unseen.",
    author: "Edward Young"
  },
  {
    text: "It's so hard to forget pain, but it's even harder to remember sweetness. We have no scar to show for happiness. We learn so little from peace.",
    author: "Chuck Palahniuk"
  },
  {
    text: "Happiness is a state of mind. It's just according to the way you look at things.",
    author: "Walt Disney"
  },
  {
    text: "Trying to be happy without giving to others is like trying to kiss alone.",
    author: "Brian Vaszily"
  }
];

module.exports = happyQuotes; 