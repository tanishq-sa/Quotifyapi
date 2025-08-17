const wisdomQuotes = [
  {
    text: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates"
  },
  {
    text: "In the end, we will remember not the words of our enemies, but the silence of our friends.",
    author: "Martin Luther King Jr."
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu"
  },
  {
    text: "Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.",
    author: "Bill Keane"
  },
  {
    text: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde"
  },
  {
    text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
    author: "Albert Einstein"
  },
  {
    text: "A wise man learns more from his enemies than a fool from his friends.",
    author: "Baltasar Gracián"
  },
  {
    text: "Knowing yourself is the beginning of all wisdom.",
    author: "Aristotle"
  },
  {
    text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.",
    author: "Aristotle"
  },
  {
    text: "Turn your wounds into wisdom.",
    author: "Oprah Winfrey"
  },
  {
    text: "The fool doth think he is wise, but the wise man knows himself to be a fool.",
    author: "William Shakespeare"
  },
  {
    text: "Silence is the sleep that nourishes wisdom.",
    author: "Francis Bacon"
  },
  {
    text: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.",
    author: "Albert Einstein"
  },
  {
    text: "Knowing others is intelligence; knowing yourself is true wisdom. Mastering others is strength; mastering yourself is true power.",
    author: "Lao Tzu"
  },
  {
    text: "Do not seek to follow in the footsteps of the wise. Seek what they sought.",
    author: "Matsuo Bashō"
  },
  {
    text: "Wisdom comes from experience. Experience is often a result of lack of wisdom.",
    author: "Terry Pratchett"
  },
  {
    text: "The simple things are also the most extraordinary things, and only the wise can see them.",
    author: "Paulo Coelho"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "I believe we are here on the planet Earth to live, grow up and do what we can to make this world a better place for all people to enjoy freedom.",
    author: "Rosa Parks"
  },
  {
    text: "To love oneself is the beginning of a lifelong romance.",
    author: "Oscar Wilde"
  },
  {
    text: "Sometimes the most important thing in a whole day is the rest we take between two deep breaths.",
    author: "Etty Hillesum"
  },
  {
    text: "Almost everything will work again if you unplug it for a few minutes, including you.",
    author: "Anne Lamott"
  },
  {
    text: "Knowing how to be solitary is central to the art of loving. When we can be alone, we can be with others without using them as a means of escape.",
    author: "Bell Hooks"
  },
  {
    text: "Time you enjoy wasting is not wasted time.",
    author: "Unknown"
  },
  {
    text: "Self-care is how you take your power back.",
    author: "Lalah Delia"
  },
  {
    text: "Being happy never goes out of style.",
    author: "Lilly Pulitzer"
  },
  {
    text: "When I'm not feeling my best I ask myself, 'What are you gonna do about it?' I use the negativity to fuel the transformation into a better me.",
    author: "Beyoncé Knowles"
  },
  {
    text: "You're braver than you believe, and stronger than you seem, and smarter than you think.",
    author: "A.A. Milne"
  },
  {
    text: "No one can make you feel inferior without your consent.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "True abundance isn't based on our net worth, it's based on our self-worth.",
    author: "Gabrielle Bernstein"
  },
  {
    text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "You are the sum total of everything you've ever seen, heard, eaten, smelled, been told, forgot—it's all there. Everything influences each of us, and because of that I try to make sure that my experiences are positive.",
    author: "Maya Angelou"
  },
  {
    text: "Sometimes, when things are falling apart, they may actually be falling into place.",
    author: "Unknown"
  },
  {
    text: "A dead end is just a good place to turn around.",
    author: "Naomi Judd"
  },
  {
    text: "Even miracles take a little time.",
    author: "The Fairy Godmother"
  },
  {
    text: "Find out who you are and do it on purpose.",
    author: "Dolly Parton"
  },
  {
    text: "The way I see it, if you want the rainbow, you gotta put up with the rain!",
    author: "Dolly Parton"
  },
  {
    text: "My mama always said, life is like a box of chocolates. You never know what you're gonna get.",
    author: "Forrest Gump"
  },
  {
    text: "Try to be a rainbow in someone else's cloud.",
    author: "Maya Angelou"
  },
  {
    text: "It's your outlook on life that counts. If you take yourself lightly and don't take yourself too seriously, pretty soon you can find the humor in our everyday lives. And sometimes it can be a lifesaver.",
    author: "Betty White"
  },
  {
    text: "Each day comes bearing its gifts. Untie the ribbon.",
    author: "Ann Ruth Schabacker"
  },
  {
    text: "Say something positive, and you'll see something positive.",
    author: "Jim Thompson"
  },
  {
    text: "To succeed in life, you need three things: a wishbone, a backbone, and a funny bone.",
    author: "Reba McEntire"
  },
  {
    text: "I never dreamed about success. I worked for it.",
    author: "Estée Lauder"
  },
  {
    text: "All you need in this life is ignorance and confidence; then success is sure.",
    author: "Mark Twain"
  },
  {
    text: "Never lose sight of the fact that the most important yard stick to your success is how you treat other people.",
    author: "Barbara Bush"
  },
  {
    text: "Success is falling nine times and getting up ten.",
    author: "Jon Bon Jovi"
  },
  {
    text: "Success is only meaningful and enjoyable if it feels like your own.",
    author: "Michelle Obama"
  },
  {
    text: "Do not judge me by my success, judge me by how many times I fell down and got back up again.",
    author: "Nelson Mandela"
  },
  {
    text: "Failure is the condiment that gives success its flavor.",
    author: "Truman Capote"
  },
  {
    text: "The secret to getting ahead is getting started.",
    author: "Mark Twain"
  },
  {
    text: "Being a successful person is not necessarily defined by what you have achieved, but by what you have overcome.",
    author: "Fannie Flagg"
  },
  {
    text: "Many of life's failures are people who did not realize how close they were to success when they gave up.",
    author: "Thomas A. Edison"
  },
  {
    text: "Money and success don't change people; they merely amplify what is already there.",
    author: "Will Smith"
  },
  {
    text: "I have very strong feelings about how you lead your life. You always look ahead, you never look back.",
    author: "Ann Richards"
  },
  {
    text: "All your life, you will be faced with a choice. You can choose love or hate…I choose love.",
    author: "Johnny Cash"
  },
  {
    text: "I don't go by the rule book…I lead from the heart, not the head.",
    author: "Princess Diana"
  },
  {
    text: "The events in our lives happen in a sequence in time, but in their significance to ourselves they find their own order the continuous thread of revelation.",
    author: "Eudora Welty"
  },
  {
    text: "The time is always right to do what is right.",
    author: "Martin Luther King Jr."
  },
  {
    text: "The best thing to hold onto in life is each other.",
    author: "Audrey Hepburn"
  },
  {
    text: "Life is not a spectator sport. If you're going to spend your whole life in the grandstand just watching what goes on, in my opinion you're wasting your life.",
    author: "Jackie Robinson"
  },
  {
    text: "If you don't like the road you're walking, start paving another one.",
    author: "Dolly Parton"
  },
  {
    text: "Despite the forecast, live like it's spring.",
    author: "Lilly Pulitzer"
  },
  {
    text: "If I'd have done all the things I was supposed to have done, I'd be really tired.",
    author: "Willie Nelson"
  },
  {
    text: "If you cannot do great things, do small things in a great way.",
    author: "Napoleon Hill"
  },
  {
    text: "You may have to fight a battle more than once to win it.",
    author: "Margaret Thatcher"
  },
  {
    text: "Your present circumstances don't determine where you can go; they merely determine where you start.",
    author: "Nido Qubein"
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar"
  },
  {
    text: "Life has no limitations, except the ones you make.",
    author: "Les Brown"
  },
  {
    text: "The two most important days in your life are the day you are born and the day you find out why.",
    author: "Mark Twain"
  },
  {
    text: "Don't bother just to be better than your contemporaries or predecessors. Try to be better than yourself.",
    author: "William Faulkner"
  },
  {
    text: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.",
    author: "Dr. Seuss"
  },
  {
    text: "A life is not important except in the impact it has on other lives.",
    author: "Jackie Robinson"
  },
  {
    text: "The older you get, the more fragile you understand life to be. I think that's good motivation for getting out of bed joyfully each day.",
    author: "Julia Roberts"
  },
  {
    text: "Now it's the little moments that stop me in my tracks, because that's what life is all about.",
    author: "Joanna Gaines"
  },
  {
    text: "Life is short, but it is wide. This too shall pass.",
    author: "Rebecca Wells"
  },
  {
    text: "Courage doesn't always roar. Sometimes courage is the little voice at the end of the day that says I'll try again tomorrow.",
    author: "Mary Anne Radmacher"
  },
  {
    text: "It is not the strength of the body that counts, but the strength of the spirit.",
    author: "J.R.R. Tolkien"
  },
  {
    text: "Courage is being scared to death, but saddling up anyway.",
    author: "John Wayne"
  },
  {
    text: "Real courage is doing the right thing when nobody's looking. Doing the unpopular thing because it's what you believe, and the heck with everybody.",
    author: "Justin Cronin"
  },
  {
    text: "It's your life; you don't need someone's permission to live the life you want. Be brave to live from your heart.",
    author: "Roy T. Bennett"
  },
  {
    text: "It's kind of fun to do the impossible.",
    author: "Walt Disney"
  },
  {
    text: "When you believe in a thing, believe in it all the way, implicitly and unquestionable.",
    author: "Walt Disney"
  },
  {
    text: "Everything you want is on the other side of fear.",
    author: "Jack Canfield"
  },
  {
    text: "The difference between winning and losing is most often not quitting.",
    author: "Walt Disney"
  },
  {
    text: "Do you give as much energy to your dreams as you do to your fears?",
    author: "Unknown"
  },
  {
    text: "You have power over your mind, not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius"
  },
  {
    text: "The biggest adventure you can take is to live the life of your dreams.",
    author: "Oprah Winfrey"
  },
  {
    text: "All serious daring starts from within.",
    author: "Eudora Welty"
  },
  {
    text: "You'll never do a whole lot unless you're brave enough to try.",
    author: "Dolly Parton"
  },
  {
    text: "It takes a deep commitment to change and an even deeper commitment to grow.",
    author: "Ralph Ellison"
  },
  {
    text: "Stand for something or you will fall for anything. Today's mighty oak is yesterday's nut that held its ground.",
    author: "Rosa Parks"
  },
  {
    text: "You cannot swim for new horizons until you have courage to lose sight of the shore.",
    author: "William Faulkner"
  },
  {
    text: "Never let the fear of striking out keep you from playing the game.",
    author: "Babe Ruth"
  },
  {
    text: "Each person must live their life as a model for others.",
    author: "Rosa Parks"
  },
  {
    text: "So long as the memory of certain beloved friends lives in my heart, I shall say that life is good.",
    author: "Helen Keller"
  },
  {
    text: "My mission in life is not merely to survive, but to thrive; and to do so with some passion, some compassion, some humor, and some style.",
    author: "Maya Angelou"
  },
  {
    text: "Life just doesn't hand you things. You have to get out there and make things happen. That's the exciting part.",
    author: "Emeril Lagasse"
  },
  {
    text: "I've been around a long time, and life still has a whole lot of surprises for me.",
    author: "Loretta Lynn"
  },
  {
    text: "Be a bush if you can't be a tree. If you can't be a highway, just be a trail. If you can't be a sun, be a star. For it isn't by size that you win or fail. Be the best of whatever you are.",
    author: "Martin Luther King Jr."
  },
  {
    text: "You're going to go through tough times—that's life. But I say, 'Nothing happens to you, it happens for you.' See the positive in negative events.",
    author: "Joel Osteen"
  },
  {
    text: "If everything was perfect, you would never learn and you would never grow.",
    author: "Beyoncé Knowles"
  },
  {
    text: "You have two choices in life; you can either like what you do or dislike what you do. I have chosen to like what I do.",
    author: "Barbara Bush"
  },
  {
    text: "The greatest legacy one can pass on to one's children and grandchildren is not money or other material things accumulated in one's life, but rather a legacy of character and faith.",
    author: "Billy Graham"
  },
  {
    text: "You build on failure. You use it as a stepping stone. Close the door on the past. You don't try to forget the mistakes, but you don't dwell on it. You don't let it have any of your energy, or any of your time, or any of your space.",
    author: "Johnny Cash"
  },
  {
    text: "You'll miss the best things if you keep your eyes shut.",
    author: "Dr. Seuss"
  },
  {
    text: "The excursion is the same when you go looking for your sorrow as when you go looking for your joy.",
    author: "Eudora Welty"
  },
  {
    text: "Life is to be lived, not controlled; and humanity is won by continuing to play in face of certain defeat.",
    author: "Ralph Ellison"
  },
  {
    text: "I've learned that you shouldn't go through life with a catcher's mitt on both hands; you need to be able to throw something back.",
    author: "Maya Angelou"
  },
  {
    text: "Always dream and shoot higher than you know you can do. Do not bother just to be better than your contemporaries or predecessors. Try to be better than yourself.",
    author: "William Faulkner"
  },
  {
    text: "We should live our lives as though Christ was coming this afternoon.",
    author: "Jimmy Carter"
  },
  {
    text: "Be so happy that, when other people look at you, they become happy too.",
    author: "Anonymous"
  },
  {
    text: "Life is either a great adventure or nothing.",
    author: "Helen Keller"
  },
  {
    text: "You only live once, but if you do it right, once is enough.",
    author: "Mae West"
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    author: "John Lennon"
  },
  {
    text: "If life were predictable it would cease to be life, and be without flavor.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "The big lesson in life, baby, is never be scared of anyone or anything.",
    author: "Frank Sinatra"
  }
];

module.exports = wisdomQuotes; 