const motivationalQuotes = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Life is what happens to you while you're busy making other plans.",
    author: "John Lennon"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson"
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "Your time is limited, so don't waste it living someone else's life.",
    author: "Steve Jobs"
  },
  {
    text: "Hardships often prepare ordinary people for an extraordinary destiny.",
    author: "C.S. Lewis"
  },
  {
    text: "Push yourself, because no one else is going to do it for you.",
    author: "Unknown"
  },
  {
    text: "Great things never come from comfort zones.",
    author: "Unknown"
  },
  {
    text: "Dream big and dare to fail.",
    author: "Norman Vaughan"
  },
  {
    text: "Success usually comes to those who are too busy to be looking for it.",
    author: "Henry David Thoreau"
  },
  {
    text: "Don't limit your challenges. Challenge your limits.",
    author: "Jerry Dunn"
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela"
  },
  {
    text: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe"
  },
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker"
  },
  {
    text: "You only have to be right once.",
    author: "Drew Houston"
  },
  {
    text: "I'm not afraid to take a swing and miss.",
    author: "Fred Smith"
  },
  {
    text: "When there is no struggle, there is no strength.",
    author: "Oprah Winfrey"
  },
  {
    text: "Opportunities don't happen, you create them.",
    author: "Chris Grosser"
  },
  {
    text: "Never give up. Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine.",
    author: "Jack Ma"
  },
  {
    text: "Nothing will work unless you do.",
    author: "Maya Angelou"
  },
  {
    text: "If you love what you do and are willing to do what it takes, it's within your reach.",
    author: "Steve Wozniak"
  },
  {
    text: "Setting goals is the first step in turning the invisible into the visible.",
    author: "Tony Robbins"
  },
  {
    text: "There's no shortage of remarkable ideas, what's missing is the will to execute them.",
    author: "Seth Godin"
  },
  {
    text: "Never, never, never give up.",
    author: "Winston Churchill"
  },
  {
    text: "Whether you think you can, or you think you can't — You're right.",
    author: "Henry Ford"
  },
  {
    text: "Things do not happen. Things are made to happen.",
    author: "John F. Kennedy"
  },
  {
    text: "If you want to achieve greatness stop asking for permission.",
    author: "Anonymous"
  },
  {
    text: "I have not failed. I've just found 10,000 ways that won't work.",
    author: "Thomas A. Edison"
  },
  {
    text: "The function of leadership is to produce more leaders, not more followers.",
    author: "Ralph Nader"
  },
  {
    text: "I find that the harder I work, the more luck I seem to have.",
    author: "Thomas Jefferson"
  },
  {
    text: "Don't be afraid to give up the good to go for the great.",
    author: "John D. Rockefeller"
  },
  {
    text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try one more time.",
    author: "Thomas A. Edison"
  },
  {
    text: "There are no shortcuts to anywhere worth going.",
    author: "Beverly Sills"
  },
  {
    text: "It's not whether you get knocked down, it's whether you get back up.",
    author: "Vince Lombardi"
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  },
  {
    text: "If you can't fly, then run. If you can't run, then walk. If you can't walk, then crawl, but whatever you do, you have to keep moving forward.",
    author: "Martin Luther King Jr."
  },
  {
    text: "You miss 100 percent of the shots you don't take.",
    author: "Wayne Gretzky"
  },
  {
    text: "The biggest risk is not taking any risk… In a world that's changing really quickly, the only strategy that is guaranteed to fail is not taking risks.",
    author: "Mark Zuckerberg"
  },
  {
    text: "Preparation is the key to success.",
    author: "Alexander Graham Bell"
  },
  {
    text: "Today a reader. Tomorrow a leader.",
    author: "Anonymous"
  },
  {
    text: "Many of life's failures are people who did not realize how close they were to success when they gave up.",
    author: "Thomas A. Edison"
  },
  {
    text: "Even if people are still very young, they shouldn't be prevented from saying what they think.",
    author: "Anne Frank"
  },
  {
    text: "You can, you should, and if you're brave enough to start, you will.",
    author: "Stephen King"
  },
  {
    text: "When you have a dream, you've got to grab it and never let go.",
    author: "Carol Burnett"
  },
  {
    text: "Our greatest glory is not in never falling but in rising every time we fall.",
    author: "Confucius"
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi"
  },
  {
    text: "If you don't have any shadows you're not in the light.",
    author: "Lady Gaga"
  },
  {
    text: "It isn't where you came from. It's where you're going that counts.",
    author: "Ella Fitzgerald"
  },
  {
    text: "A ship is always safe at the shore, but that is not what it is built for.",
    author: "Albert Einstein"
  },
  {
    text: "Don't wait for the perfect conditions for success to happen; just go ahead and do something.",
    author: "Dan Miller"
  },
  {
    text: "What seems to us as bitter trials are often blessings in disguise.",
    author: "Oscar Wilde"
  },
  {
    text: "Go as far as you can see; when you get there, you'll be able to see further.",
    author: "Thomas Carlyle"
  },
  {
    text: "You learn more from failure than from success. Don't let it stop you. Failure builds character.",
    author: "Anonymous"
  },
  {
    text: "A river cuts through rock, not because of its power but because of its persistence.",
    author: "Jim Watkins"
  },
  {
    text: "Be so good they can't ignore you.",
    author: "Steve Martin"
  },
  {
    text: "Success doesn't come to you, you go to it.",
    author: "Marva Collins"
  },
  {
    text: "With the new day comes new strength and new thoughts.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "It is never too late to be what you might have been.",
    author: "George Eliot"
  },
  {
    text: "If I cannot do great things, I can do small things in a great way.",
    author: "Martin Luther King Jr."
  },
  {
    text: "It's a good day to have a good day.",
    author: "Anonymous"
  },
  {
    text: "You didn't come this far to only come this far.",
    author: "Anonymous"
  },
  {
    text: "Work hard in silence, let your success be your noise.",
    author: "Frank Ocean"
  },
  {
    text: "A goal should scare you a little, and excite you a lot.",
    author: "Joe Vitale"
  },
  {
    text: "Don't let yesterday take up too much of today.",
    author: "Will Rogers"
  },
  {
    text: "Every morning starts a new page in your story. Make it a great one today.",
    author: "Doe Zantamata"
  },
  {
    text: "Don't let life discourage you; everyone who got where he is had to begin where he was.",
    author: "Richard L. Evans"
  },
  {
    text: "Go the extra mile, it's never crowded.",
    author: "Anonymous"
  },
  {
    text: "Keep your sunny side up, keep yourself beautiful, and indulge yourself.",
    author: "Betsey Johnson"
  },
  {
    text: "Life is 10% what happens to you and 90% how you react to it.",
    author: "Charles R. Swindoll"
  },
  {
    text: "Life is like riding a bicycle. To keep your balance, you must keep moving.",
    author: "Albert Einstein"
  },
  {
    text: "Limit your 'always' and your 'nevers.'",
    author: "Amy Poehler"
  },
  {
    text: "Nothing is impossible. The word itself says 'I'm possible!'",
    author: "Audrey Hepburn"
  },
  {
    text: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis"
  },
  {
    text: "Don't let the fear of striking out hold you back.",
    author: "Babe Ruth"
  },
  {
    text: "Believe me, the reward is not so great without the struggle.",
    author: "Wilma Rudolph"
  },
  {
    text: "When you fall, get right back up.",
    author: "Lindsay Vonn"
  },
  {
    text: "If you don't love what you do, you won't do it with much conviction or passion.",
    author: "Mia Hamm"
  },
  {
    text: "If you aren't going all the way, why go at all?",
    author: "Joe Namath"
  },
  {
    text: "Obstacles don't have to stop you. If you run into a wall, don't turn around and give up.",
    author: "Michael Jordan"
  },
  {
    text: "Champions keep playing until they get it right.",
    author: "Billie Jean King"
  },
  {
    text: "You have to believe in yourself when no one else does.",
    author: "Venus Williams"
  },
  {
    text: "Always make a total effort, even when the odds are against you.",
    author: "Arnold Palmer"
  },
  {
    text: "If you have everything under control, you're not moving fast enough.",
    author: "Mario Andretti"
  },
  {
    text: "It isn't the mountains ahead to climb that wear you out; It's the pebble in your shoe.",
    author: "Muhammad Ali"
  },
  {
    text: "Do not wait; the time will never be just right.",
    author: "George Herbert"
  },
  {
    text: "Too many of us are not living our dreams because we are living our fears.",
    author: "Les Brown"
  },
  {
    text: "If you can dream it, you can do it.",
    author: "Walt Disney"
  },
  {
    text: "Aim for the moon. If you miss, you may hit a star.",
    author: "W. Clement Stone"
  },
  {
    text: "Only I can change my life. No one can do it for me.",
    author: "Carol Burnett"
  },
  {
    text: "Do one thing every day that scares you.",
    author: "Anonymous"
  },
  {
    text: "The most beautiful thing you can wear is confidence.",
    author: "Blake Lively"
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius"
  },
  {
    text: "Look up at the stars and not down at your feet. Try to make sense of what you see, and wonder about what makes the universe exist. Be curious.",
    author: "Stephen Hawking"
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain"
  },
  {
    text: "Act as if what you do makes a difference. It does.",
    author: "William James"
  },
  {
    text: "You must do the things you think you cannot do.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "Try to be a rainbow in someone's cloud.",
    author: "Maya Angelou"
  },
  {
    text: "That which doesn't kill us makes us stronger.",
    author: "Friedrich Nietzsche"
  },
  {
    text: "Do not let what you cannot do interfere with what you can do.",
    author: "John Wooden"
  },
  {
    text: "Successful entrepreneurs are givers and not takers of positive energy.",
    author: "Anonymous"
  },
  {
    text: "An attitude of positive expectation is the mark of the superior personality.",
    author: "Brian Tracy"
  },
  {
    text: "Impossible is just an opinion, don't buy it.",
    author: "Robin Sharma"
  },
  {
    text: "Keep your face always toward the sunshine—and shadows will fall behind you.",
    author: "Walt Whitman"
  },
  {
    text: "The glow of one warm thought is to me worth more than money.",
    author: "Thomas Jefferson"
  },
  {
    text: "When the sun is shining I can do anything; no mountain is too high, no trouble too difficult to overcome.",
    author: "Wilma Rudolph"
  },
  {
    text: "Each day provides its own gifts.",
    author: "Marcus Aurelius"
  },
  {
    text: "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.",
    author: "Albert Schweitzer"
  },
  {
    text: "Sometimes you will never know the value of a moment, until it becomes a memory.",
    author: "Dr. Seuss"
  },
  {
    text: "The most wasted of days is one without laughter.",
    author: "E. E. Cummings"
  },
  {
    text: "With the new day comes new strength and new thoughts.",
    author: "Eleanor Roosevelt"
  }
];

module.exports = motivationalQuotes; 