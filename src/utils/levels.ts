export const Levels = {
    // Calculate Total XP required to reach a specific level
    xpForLevel: (level: number) => {
        return 5 * (level ** 2) + 50 * level + 100
    },

    // Calculate Level from Total XP (Iterative/Search or Inverse)
    // Inverse of Qudratic 5x^2 + 50x + (100 - XP) = 0
    // x = (-50 + sqrt(50^2 - 4*5*(100-XP))) / (2*5)
    // x = (-50 + sqrt(2500 - 20*(100-XP))) / 10
    levelForXp: (xp: number) => {
        let level = 0
        while (Levels.xpForLevel(level) <= xp) {
            level++
        }
        return level // actually returns next level, so level-1 is current completed level?
        // Wait, if xpForLevel(0) = 100, and I have 50 XP. Loop doesn't run. Return 0. Correct.
        // If I have 100 XP. Loop runs once (0). xpForLevel(1) = 155. Loop stops. Return 1. Correct.
    },

    // XP needed for next level
    xpToNextLevel: (level: number) => {
        return Levels.xpForLevel(level + 1) - Levels.xpForLevel(level)
    }
}
