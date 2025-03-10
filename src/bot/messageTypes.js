/**
 * Creates a header message.
 * 
 * @param {string} message - The message content.
 * @return {string} - The formatted message with header markdown.
 */
function headerMessage(message) {
    return `**#${message}**`; 
}

/**
 * Creates a bold message.
 * 
 * @param {string} message - The message content.
 * @return {string} - The formatted message with bold markdown.
 */
function boldMessage(message) {
    return `**${message}**`; 
}

/**
 * Creates an inline code block message.
 * 
 * @param {string} message - The message content.
 * @return {string} - The formatted message as inline code markdown.
 */
function codeBlockMessage(message) {
    return `\`${message}\``; 
}

/**
 * Creates a multiline code block message.
 * 
 * @param {string} message - The message content.
 * @return {string} - The formatted message as a multiline code block markdown.
 */
function multiLineCodeBlockMessage(message) {
    return `\`\`\`${message}\`\`\``; 
}

/**
 * Creates an italic message.
 * 
 * @param {string} message - The message content.
 * @return {string} - The formatted message with italic markdown.
 */
function italicMessage(message) {
    return `*${message}*`; 
}

/**
 * Creates a blockquote message.
 * 
 * @param {string} message - The message content.
 * @return {string} - The formatted message as a blockquote markdown.
 */
function blockquoteMessage(message) {
    return `> ${message}`; 
}

/**
 * Creates a multi-line blockquote message.
 * 
 * @param {string} message - The message content.
 * @return {string} - The formatted message as a multi-line blockquote markdown.
 */
function multiLineBlockquoteMessage(message) {
    return `>>> ${message}`; 
}

/**
 * Creates a list message.
 * @param {string[]} items - The list items.
 * @return {string} - The formatted message as a list markdown.
 */
function listMessage(items) {
    return items.map(item => `- ${item}`).join('\n');
}

/**
 * Creates a Masked list message.
 * 
 * @param {string} message - The message content.
 * @param {string} link - The URL that the link will point to.
 * @returns {string} - The formatted message as a Masked Link markdown.
 */
function maskedLinks(message, link) {
    return `[${message}](${link})`;
}

// Export all functions
module.exports = {
    headerMessage,
    codeBlockMessage,
    multiLineCodeBlockMessage,
    italicMessage,
    blockquoteMessage,
    multiLineBlockquoteMessage,
    listMessage,
    maskedLinks,
    boldMessage
};