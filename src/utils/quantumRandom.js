/**
 * Fetches true random numbers from the ANU Quantum Random Numbers Server.
 * @param {number} count - The number of random items needed (e.g., 3 for 3 coins).
 * @returns {Promise<boolean[]>} - An array of booleans (true for Heads/Yang, false for Tails/Yin).
 */
export async function fetchQuantumUtils(count = 3) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch(`https://qrng.anu.edu.au/API/jsonI.php?length=${count}&type=uint8`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.success && Array.isArray(data.data)) {
            // Convert uint8 to boolean (even = true/Heads, odd = false/Tails) 
            // This is arbitrary but valid for distribution
            return data.data.slice(0, count).map(num => num % 2 === 0);
        } else {
            throw new Error('Invalid data structure');
        }

    } catch (error) {
        console.warn('Quantum Randomness failed, falling back to pseudo-random:', error);
        // Fallback to Math.random()
        return Array(count).fill(0).map(() => Math.random() > 0.5);
    }
}
