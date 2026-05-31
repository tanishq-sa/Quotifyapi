#!/usr/bin/env node

const http = require('http');
const https = require('https');
const url = require('url');
const readline = require('readline');

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

// Prompt the user for their API key
function askApiKey() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(colorize('🔑 Enter your QUOTIFY_API_KEY: ', 'cyan'), (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
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
    console.log(colorize('Options:', 'bright'));
    console.log('  -t, --type <name>   Shortcut to get a quote from a specific category');
    console.log('  --types             Shortcut to show all quote categories');
    console.log('  --stats             Shortcut to show quote statistics');
    console.log('');
    console.log(colorize('Examples:', 'bright'));
    console.log('  quotifyapi random');
    console.log('  quotifyapi type motivational');
    console.log('  quotifyapi --type love');
    console.log('  quotifyapi types');
    console.log('  quotifyapi stats');
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
function displayTypes(types, counts) {
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
function displayStats(counts) {
    console.log('');
    console.log(colorize('📊 Quote Statistics', 'cyan'));
    console.log(colorize('==================', 'cyan'));
    console.log('');
    
    const types = Object.keys(counts).filter(k => k !== 'total');
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

// Helper to make HTTP/HTTPS GET requests
function makeRequest(apiUrl, headers = {}) {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = url.parse(apiUrl);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.path,
                method: 'GET',
                headers: {
                    'User-Agent': 'Quotify-CLI/1.3.0',
                    ...headers
                }
            };
            
            const req = protocol.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve({
                            statusCode: res.statusCode,
                            data: parsedData
                        });
                    } catch (e) {
                        reject(new Error(`Failed to parse API response: ${data.substring(0, 100)}`));
                    }
                });
            });
            
            req.on('error', (err) => {
                reject(err);
            });
            
            req.end();
        } catch (e) {
            reject(e);
        }
    });
}

// Main CLI logic
async function main() {
    const args = process.argv.slice(2);
    
    // Check for help flags or empty args
    if (args.length === 0 || args.includes('help') || args.includes('--help') || args.includes('-h')) {
        showBanner();
        showHelp();
        return;
    }
    
    // Check API Key
    let apiKey = process.env.QUOTIFY_API_KEY;
    if (!apiKey) {
        if (process.stdout.isTTY) {
            showBanner();
            console.log(colorize('⚠️  QUOTIFY_API_KEY environment variable is not set.', 'yellow'));
            console.log('You can set it in your environment or enter it below to proceed.');
            console.log('');
            apiKey = await askApiKey();
            if (!apiKey) {
                console.log(colorize('❌ Error: API key is required to make requests.', 'red'));
                process.exit(1);
            }
            console.log('');
        } else {
            console.log(colorize('❌ Error: QUOTIFY_API_KEY environment variable is not set.', 'red'));
            console.log('');
            console.log('Please set your API key in your environment to authenticate CLI requests.');
            console.log('You can get your API key from the Quotify Dashboard.');
            console.log('');
            console.log(colorize('On Linux/macOS:', 'bright'));
            console.log(`  export QUOTIFY_API_KEY="your_api_key_here"`);
            console.log('');
            console.log(colorize('On Windows (Command Prompt):', 'bright'));
            console.log(`  set QUOTIFY_API_KEY="your_api_key_here"`);
            console.log('');
            console.log(colorize('On Windows (PowerShell):', 'bright'));
            console.log(`  $env:QUOTIFY_API_KEY="your_api_key_here"`);
            console.log('');
            process.exit(1);
        }
    }
    
    const BASE_URL = process.env.QUOTIFY_API_URL || 'https://quotify.dazzelr.tech';
    const requestHeaders = {
        'x-api-key': apiKey
    };
    
    // Parse arguments
    let command = args[0].toLowerCase();
    let category = '';
    
    if (command === '--types') {
        command = 'types';
    } else if (command === '--stats') {
        command = 'stats';
    } else if (command === 'type' || command === '--type' || command === '-t') {
        command = 'type';
        category = args[1];
    }
    
    try {
        switch (command) {
            case 'random':
                {
                    const res = await makeRequest(`${BASE_URL}/api/v1/quotes`, requestHeaders);
                    if (res.statusCode === 200) {
                        displayQuote(res.data.quote, res.data.type);
                    } else {
                        const errorMsg = res.data.message || res.data.error || 'Failed to fetch quote';
                        console.log(colorize(`❌ Error: ${errorMsg}`, 'red'));
                    }
                }
                break;
                
            case 'type':
                {
                    if (!category) {
                        console.log(colorize('❌ Error: Please specify a category', 'red'));
                        console.log(colorize('   Example: quotifyapi type motivational', 'yellow'));
                        return;
                    }
                    
                    const res = await makeRequest(`${BASE_URL}/api/v1/quotes/category/${category.toLowerCase()}`, requestHeaders);
                    if (res.statusCode === 200) {
                        displayQuote(res.data.quote, res.data.category);
                    } else {
                        const errorMsg = res.data.message || res.data.error || 'Failed to fetch quote by category';
                        console.log(colorize(`❌ Error: ${errorMsg}`, 'red'));
                    }
                }
                break;
                
            case 'types':
                {
                    const res = await makeRequest(`${BASE_URL}/api/v1/quotes/types`, requestHeaders);
                    if (res.statusCode === 200) {
                        showBanner();
                        displayTypes(res.data.availableTypes, res.data.counts);
                    } else {
                        const errorMsg = res.data.message || res.data.error || 'Failed to fetch categories';
                        console.log(colorize(`❌ Error: ${errorMsg}`, 'red'));
                    }
                }
                break;
                
            case 'stats':
                {
                    const res = await makeRequest(`${BASE_URL}/api/v1/quotes/stats`, requestHeaders);
                    if (res.statusCode === 200) {
                        showBanner();
                        displayStats(res.data.counts);
                    } else {
                        const errorMsg = res.data.message || res.data.error || 'Failed to fetch statistics';
                        console.log(colorize(`❌ Error: ${errorMsg}`, 'red'));
                    }
                }
                break;
                
            default:
                console.log(colorize(`❌ Unknown command: ${command}`, 'red'));
                console.log(colorize('   Use "quotifyapi help" to see available commands', 'yellow'));
                break;
        }
    } catch (error) {
        console.log(colorize(`❌ Connection Error: ${error.message}`, 'red'));
        console.log(`   Make sure the server is online and you can access ${BASE_URL}`);
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
