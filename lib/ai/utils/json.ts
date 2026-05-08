/**
 * Attempts to repair a truncated JSON string by closing unclosed brackets/braces/quotes.
 */
export function tryFixTruncatedJson(text: string): string {
    let fixed = text.trim();

    // 1. Remove trailing comma if it exists (e.g., {"a": 1, )
    fixed = fixed.replace(/,\s*$/, "");

    const stack: string[] = [];
    let inString = false;
    let escaped = false;

    for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];
        if (char === '"' && !escaped) {
            inString = !inString;
        }
        if (inString) {
            if (char === "\\" && !escaped) {
                escaped = true;
            } else {
                escaped = false;
            }
            continue;
        }

        if (char === "{" || char === "[") {
            stack.push(char);
        } else if (char === "}") {
            if (stack[stack.length - 1] === "{") stack.pop();
        } else if (char === "]") {
            if (stack[stack.length - 1] === "[") stack.pop();
        }
    }

    // 2. If we are inside a string, close it
    if (inString) {
        fixed += '"';
    }

    // 3. Close unclosed objects and arrays in reverse order
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === "{") fixed += "}";
        else if (last === "[") fixed += "]";
    }

    return fixed;
}

/**
 * Try to parse a string into JSON with several fallbacks.
 * - Strips common code fences
 * - Attempts direct JSON.parse
 * - Attempts to extract the outermost {...} or [...] substring
 * - Attempts to fix truncation if both fail
 */
export function parseJsonResponse<T = any>(text: string, label = "response"): T {
    let trimmed = text.trim();
    
    // 1. Strip triple-backtick fences
    if (trimmed.startsWith("```")) {
        trimmed = trimmed.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }

    const attempt = (s: string) => {
        try {
            return JSON.parse(s);
        } catch {
            return null;
        }
    };

    // 2. Try direct parse
    let result = attempt(trimmed);
    if (result) return result as T;

    // 3. Try extracting JSON object/array
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        result = attempt(trimmed.slice(firstBrace, lastBrace + 1));
        if (result) return result as T;
    }

    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        result = attempt(trimmed.slice(firstBracket, lastBracket + 1));
        if (result) return result as T;
    }

    // 4. Try to fix truncation
    console.warn(`Attempting to fix potentially truncated JSON for ${label}...`);
    const fixed = tryFixTruncatedJson(trimmed);
    result = attempt(fixed);
    if (result) {
        console.log(`Successfully recovered JSON for ${label} using fix logic.`);
        return result as T;
    }

    // 5. Regex attempt for objects
    const objMatch = trimmed.match(/\{[\s\S]*/);
    if (objMatch) {
        const fixedRegex = tryFixTruncatedJson(objMatch[0]);
        result = attempt(fixedRegex);
        if (result) return result as T;
    }

    console.error(`Failed to parse JSON ${label}:`, trimmed.substring(0, 500));
    throw new Error(`Failed to parse JSON ${label}`);
}
