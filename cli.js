#!/usr/bin/env node

const { getRandomQuote, getRandomQuoteByType, getAvailableTypes, getQuotesCount } = require('./quotes');

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Helper function to colorize text
function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

// Display banner
function showBanner() {
    console.log(colorize('💬 Quote API CLI', 'cyan'));
    console.log(colorize('================', 'cyan'));
    console.log('');
}

// Display help information
function showHelp() {
    console.log(colorize('Usage:', 'bright'));
    console.log('  quotifyapi [command] [options]');
    console.log('');
    console.log(colorize('Commands:', 'bright'));
    console.log('  random              Get a random quote from any category');
    console.log('  type <category>     Get a random quote from a specific category');
    console.log('  types               Show all available quote categories');
    console.log('  stats               Show quote statistics by category');
    console.log('  help                Show this help message');
    console.log('');
    console.log(colorize('Examples:', 'bright'));
    console.log('  quotifyapi random');
    console.log('  quotifyapi type motivational');
    console.log('  quotifyapi type love');
    console.log('  quotifyapi types');
    console.log('  quotifyapi stats');
    console.log('');
    console.log(colorize('Available Categories:', 'bright'));
    const types = getAvailableTypes();
    types.forEach(type => {
        console.log(`  - ${colorize(type, 'green')}`);
    });
}

// Display a quote with nice formatting
function displayQuote(quote, type = 'random') {
    console.log('');
    console.log(colorize('┌─ Quote ──────────────────────────────────────', 'blue'));
    console.log(colorize(`│ Category: ${type}`, 'cyan'));
    console.log(colorize('├─────────────────────────────────────────────', 'blue'));
    console.log(colorize(`│ "${quote.text}"`, 'white'));
    console.log(colorize('├─────────────────────────────────────────────', 'blue'));
    console.log(colorize(`│ — ${quote.author}`, 'yellow'));
    console.log(colorize('└─────────────────────────────────────────────', 'blue'));
    console.log('');
}

// Display types with counts
function displayTypes() {
    const types = getAvailableTypes();
    const counts = getQuotesCount();
    
    console.log('');
    console.log(colorize('📚 Available Quote Categories', 'cyan'));
    console.log(colorize('================================', 'cyan'));
    console.log('');
    
    types.forEach(type => {
        const count = counts[type];
        const bar = '█'.repeat(Math.min(count, 20));
        const percentage = ((count / counts.total) * 100).toFixed(1);
        
        console.log(`${colorize(type.padEnd(15), 'green')} ${colorize(count.toString().padStart(3), 'yellow')} quotes ${colorize(`(${percentage}%)`, 'cyan')}`);
        console.log(`                ${colorize(bar, 'blue')}`);
    });
    
    console.log('');
    console.log(colorize(`Total: ${counts.total} quotes`, 'bright'));
    console.log('');
}

// Display statistics
function displayStats() {
    const counts = getQuotesCount();
    
    console.log('');
    console.log(colorize('📊 Quote Statistics', 'cyan'));
    console.log(colorize('==================', 'cyan'));
    console.log('');
    
    const types = getAvailableTypes();
    types.forEach(type => {
        const count = counts[type];
        const percentage = ((count / counts.total) * 100).toFixed(1);
        const bar = '█'.repeat(Math.min(Math.round((count / counts.total) * 30), 30));
        
        console.log(`${colorize(type.padEnd(15), 'green')} ${colorize(count.toString().padStart(3), 'yellow')} quotes ${colorize(`(${percentage}%)`, 'cyan')}`);
        console.log(`                ${colorize(bar, 'blue')}`);
    });
    
    console.log('');
    console.log(colorize(`Total Quotes: ${counts.total}`, 'bright'));
    console.log(colorize(`Categories: ${types.length}`, 'bright'));
    console.log('');
}

// Main CLI logic
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === 'help') {
        showBanner();
        showHelp();
        return;
    }
    
    const command = args[0].toLowerCase();
    
    try {
        switch (command) {
            case 'random':
                const randomQuote = getRandomQuote();
                displayQuote(randomQuote, 'random');
                break;
                
            case 'type':
                if (!args[1]) {
                    console.log(colorize('❌ Error: Please specify a category', 'red'));
                    console.log(colorize('   Example: quote-api type motivational', 'yellow'));
                    return;
                }
                
                const category = args[1].toLowerCase();
                const typeQuote = getRandomQuoteByType(category);
                
                if (!typeQuote) {
                                    console.log(colorize(`❌ Error: Category "${category}" not found`, 'red'));
                console.log(colorize('   Use "quotifyapi types" to see available categories', 'yellow'));
                    return;
                }
                
                displayQuote(typeQuote, category);
                break;
                
            case 'types':
                showBanner();
                displayTypes();
                break;
                
            case 'stats':
                showBanner();
                displayStats();
                break;
                
            default:
                console.log(colorize(`❌ Unknown command: ${command}`, 'red'));
                console.log(colorize('   Use "quotifyapi help" to see available commands', 'yellow'));
                break;
        }
    } catch (error) {
        console.log(colorize(`❌ Error: ${error.message}`, 'red'));
        process.exit(1);
    }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
    console.log('\n' + colorize('👋 Goodbye!', 'cyan'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n' + colorize('👋 Goodbye!', 'cyan'));
    process.exit(0);
});

// Run the CLI
if (require.main === module) {
    main();
}

module.exports = { main, showHelp, displayQuote, displayTypes, displayStats };
