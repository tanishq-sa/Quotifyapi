const sadQuotes = [
  {
    text: "The way sadness works is one of the strange riddles of the world. If you are stricken with a great sadness, you may feel as if you have been set aflame, not only because of the enormous pain but also because your sadness may spread over your life, like smoke from an enormous fire.",
    author: "Lemony Snicket"
  },
  {
    text: "Tears come from the heart and not from the brain.",
    author: "Leonardo da Vinci"
  },
  {
    text: "The good times of today are the sad thoughts of tomorrow.",
    author: "Bob Marley"
  },
  {
    text: "Sadness flies away on the wings of time.",
    author: "Jean de La Fontaine"
  },
  {
    text: "Behind every sweet smile, there is a bitter sadness that no one can ever see and feel.",
    author: "Tupac Shakur"
  },
  {
    text: "The walls we build around us to keep sadness out also keeps out the joy.",
    author: "Jim Rohn"
  },
  {
    text: "Sadness is but a wall between two gardens.",
    author: "Kahlil Gibran"
  },
  {
    text: "Sadness comes in waves like the tide, always felt.",
    author: "Kurt Vonnegut"
  },
  {
    text: "Sadness is like a shadow, never announced.",
    author: "Pablo Neruda"
  },
  {
    text: "Sadness comes in waves like the tide, always felt.",
    author: "Lang Leav"
  },
  {
    text: "Sadness creeps in like a silent fog, always felt.",
    author: "Albert Camus"
  },
  {
    text: "Sadness is like a shadow, rarely seen.",
    author: "Kurt Vonnegut"
  },
  {
    text: "Sadness feels like a storm, always felt.",
    author: "Oscar Wilde"
  },
  {
    text: "Sadness is like a slow poison, rarely seen.",
    author: "Sylvia Plath"
  },
  {
    text: "Sadness creeps in like a shadow, deeply hidden.",
    author: "Virginia Woolf"
  },
  {
    text: "Sadness comes in waves like the tide, rarely seen.",
    author: "Stephen King"
  },
  {
    text: "Sadness is like a storm, never announced.",
    author: "Rumi"
  },
  {
    text: "Sadness creeps in like the tide, deeply hidden.",
    author: "Emily Dickinson"
  },
  {
    text: "Sadness is like a slow poison, always felt.",
    author: "Charles Bukowski"
  },
  {
    text: "Sadness comes in waves like a storm, rarely seen.",
    author: "George Orwell"
  },
  {
    text: "Sadness is like a silent fog, never announced.",
    author: "Friedrich Nietzsche"
  },
  {
    text: "Sadness feels like the tide, deeply hidden.",
    author: "Ernest Hemingway"
  },
  {
    text: "Sadness creeps in like a shadow, never announced.",
    author: "Haruki Murakami"
  },
  {
    text: "Sadness is like a storm, deeply hidden.",
    author: "Lang Leav"
  },
  {
    text: "Sadness comes in waves like a slow poison, always felt.",
    author: "Albert Camus"
  },
  {
    text: "Sadness is like the tide, deeply hidden.",
    author: "Pablo Neruda"
  },
  {
    text: "Sadness creeps in like a silent fog, rarely seen.",
    author: "Oscar Wilde"
  },
  {
    text: "There are moments when I wish I could roll back the clock and take all the sadness away, but I have the feeling that if I did, the joy would be gone as well.",
    author: "Nicholas Sparks"
  },
  {
    text: "Life's under no obligation to give us what we expect.",
    author: "Margaret Mitchell"
  },
  {
    text: "You see, I usually find myself among strangers because I drift here and there trying to forget the sad things that happened to me.",
    author: "F. Scott Fitzgerald"
  },
  {
    text: "Don't go around saying the world owes you a living. The world owes you nothing. It was here first.",
    author: "Mark Twain"
  },
  {
    text: "Things change. And friends leave. And life doesn't stop for anybody.",
    author: "Stephen Chbosky"
  },
  {
    text: "One must not let oneself be overwhelmed by sadness.",
    author: "Jacqueline Kennedy-Onassis"
  },
  {
    text: "The word 'happy' would lose its meaning if it were not balanced by sadness.",
    author: "Carl Jung"
  },
  {
    text: "Life is a moderately good play with a badly written third act.",
    author: "Truman Capote"
  },
  {
    text: "Learning is a gift. Even when pain is your teacher.",
    author: "Maya Watson"
  },
  {
    text: "I have learned now that while those who speak about one's miseries usually hurt, those who keep silence hurt more.",
    author: "C.S. Lewis"
  },
  {
    text: "The excursion is the same when you go looking for your sorrow as when you go looking for your joy.",
    author: "Eudora Welty"
  },
  {
    text: "Don't ever tell anybody anything. If you do, you start missing everybody.",
    author: "J.D. Salinger"
  },
  {
    text: "I wish I could go back to the day I met you and just walk away.",
    author: "Unknown"
  },
  {
    text: "I'm not crying because of you; you're not worth it. I'm crying because my delusion of who you were was shattered by the truth of who you are.",
    author: "Steve Maraboli"
  },
  {
    text: "To live in a hallucination of being loved is more painful than rejection.",
    author: "Vinaya Panicker"
  },
  {
    text: "So it's true, when all is said and done, grief is the price we pay for love.",
    author: "E.A. Bucchianeri"
  },
  {
    text: "What is hardest to accept about the passage of time is that the people who once mattered the most to us wind up in parentheses.",
    author: "John Irving"
  },
  {
    text: "Our dead are never dead to us until we have forgotten them.",
    author: "George Eliot"
  },
  {
    text: "The bitterest tears shed over graves are for words left unsaid and deeds left undone.",
    author: "Harriet Beecher Stowe"
  },
  {
    text: "It is the unknown we fear when we look upon death and darkness, nothing more.",
    author: "J.K. Rowling"
  },
  {
    text: "It's sad when someone you know becomes someone you knew.",
    author: "Henry Rollins"
  },
  {
    text: "There is a time for departure, even when there's no certain place to go.",
    author: "Tennessee Williams"
  },
  {
    text: "You meet everyone twice in this life, when they come and when they go.",
    author: "C.C Aurel"
  },
  {
    text: "Grief is not as heavy as guilt, but it takes more away from you.",
    author: "Veronica Roth"
  },
  {
    text: "Death is a great revealer of what is in a man, and in its solemn shadow appear the naked lineaments of the soul.",
    author: "E.H. Chapin"
  },
  {
    text: "Death is the dropping of the flower that the fruit may swell.",
    author: "Henry Ward Beecher"
  },
  {
    text: "You know, a heart can be broken, but it keeps on beating, just the same.",
    author: "Fannie Flagg"
  },
  {
    text: "It's amazing how someone can break your heart, and you can still love them with all the little pieces.",
    author: "Ella Harper"
  },
  {
    text: "I keep thinking about this river somewhere, with the water moving really fast. And these two people in the water, trying to hold onto each other, holding on as hard as they can, but in the end it's just too much. The current's too strong. They've got to let go, drift apart. That's how it is with us.",
    author: "Kazuo Ishiguro"
  },
  {
    text: "Some stories don't have happy endings. Even love stories. Maybe especially love stories.",
    author: "Kristin Hannah"
  },
  {
    text: "There is a distinct, awful pain that comes with loving someone more than they love you.",
    author: "Steve Maraboli"
  },
  {
    text: "To have been loved so deeply, even though the person who loved us is gone, will give us some protection forever.",
    author: "J.K. Rowling"
  },
  {
    text: "To have felt too much is to end in feeling nothing.",
    author: "Dorothy Thompson"
  },
  {
    text: "Now, you are just a stranger with all my secrets.",
    author: "Unknown"
  },
  {
    text: "I never got to fall out of love. I just had to move on.",
    author: "Christina Lauren"
  },
  {
    text: "Our greatest joy and our greatest pain come in our relationships with others.",
    author: "Stephen R. Covey"
  },
  {
    text: "Love is so short, forgetting is so long.",
    author: "Pablo Neruda"
  },
  {
    text: "To fall in love is awfully simple, but to fall out of love is simply awful.",
    author: "Bess Myerson"
  },
  {
    text: "If you gave someone your heart and they died, did they take it with them? Did you spend the rest of forever with a hole inside you that couldn't be filled?",
    author: "Jodi Picoult"
  },
  {
    text: "You make me feel like a firefly. Trapped in a belljar; starved for love.",
    author: "Ayushee Ghoshal"
  },
  {
    text: "You're like a song that I heard when I was a little kid but forgot I knew until I heard it again.",
    author: "Maggie Stiefvater"
  },
  {
    text: "There is no greater sorrow than to recall, in misery, the time when we were happy.",
    author: "Dante Alighieri"
  },
  {
    text: "The worst feeling isn't being lonely, it's being forgotten by someone you'd never forget.",
    author: "Helen Hywater"
  },
  {
    text: "Sometimes you got to hurt something to help something. Sometimes you have to plow under one thing in order for something else to grow.",
    author: "Ernest J. Gaines"
  },
  {
    text: "Nobody has ever measured, not even poets, how much the heart can hold.",
    author: "Zelda Fitzgerald"
  },
  {
    text: "Broken relationships are a source of heavy heartbreak that seem to affect every family.",
    author: "Jerry B. Jenkins"
  },
  {
    text: "Who has not sat before his own heart's curtain? It lifts: and the scenery is falling apart.",
    author: "Rainer Maria Rilke"
  },
  {
    text: "Stab the body and it heals, but injure the heart and the wound lasts a lifetime.",
    author: "Mineko Iwasaki"
  },
  {
    text: "Tears are words the mouth can't say nor can the heart bear.",
    author: "Joshua Wisenbaker"
  },
  {
    text: "Of all the words of mice and men, the saddest are, 'It might have been.'",
    author: "Kurt Vonnegut"
  },
  {
    text: "We must understand that sadness is an ocean, and sometimes we drown, while other days we are forced to swim.",
    author: "R.M. Drake"
  },
  {
    text: "It is sadder to find the past again and find it inadequate to the present than it is to have it elude you and remain forever a harmonious conception of memory.",
    author: "F. Scott Fitzgerald"
  },
  {
    text: "I always like walking in the rain, so no one can see me crying.",
    author: "Charlie Chaplin"
  },
  {
    text: "One thing you can't hide is when you're crippled inside.",
    author: "John Lennon"
  },
  {
    text: "Being a successful person is not necessarily defined by what you have achieved, but by what you have overcome.",
    author: "Fannie Flagg"
  },
  {
    text: "Faking a smile is so much easier than explaining why you are sad.",
    author: "Iona Mink"
  },
  {
    text: "There are years that ask questions and years that answer.",
    author: "Zora Neale Hurston"
  },
  {
    text: "Heavy hearts, like heavy clouds in the sky, are best relieved by the letting of a little water.",
    author: "Christopher Morley"
  },
  {
    text: "Long after I have given up, my heart still searches for you without my permission.",
    author: "Rudy Francisco"
  },
  {
    text: "Some people feel like they don't deserve love. They walk away quietly into empty spaces, trying to close the gaps of the past.",
    author: "Jon Krakauer"
  }
];

module.exports = sadQuotes;