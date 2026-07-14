# 🏃 Runner Card Attributes

Overall Rating (OVR)
65–99

Calculated from all stats.

---

⚡ PAC (Pace)

How fast the runner is.

Calculated from:

- Average Pace
- Best Pace
- Sprint Segments

Example

3:40/km → 98

4:30/km → 90

5:30/km → 80

6:30/km → 70

7:30/km → 60

---

🫀 END (Endurance)

How long the runner can maintain effort.

Calculated from:

- Total Distance
- Moving Time
- Longest Run

Examples

5K → 65

10K → 78

HM → 90

Marathon → 97

Ultra → 99

---

🎯 CON (Consistency)

Measures pacing consistency.

Calculated from:

- Pace variance
- Split analysis
- Negative split bonus

Example

Very stable pace

⭐⭐⭐⭐⭐

↓

CON 94

---

❤️ REC (Recovery)

Heart rate efficiency.

Calculated from

- Average HR
- Max HR
- HR drift

Lower HR at similar pace = higher score.

---

🦿 CAD (Cadence)

Running rhythm.

Based on average cadence.

Ideal

170–185 SPM

↓

95+

Too low

↓

60–75

---

⛰️ CLB (Climbing)

Hill capability.

Calculated from

- Elevation Gain
- Uphill Pace

---

🔥 HUS (Hustle)

Commitment level.

Calculated from

- Weekly frequency
- Consecutive activities
- Monthly mileage

Someone who runs almost every day gets a very high Hustle rating.

---

🎖️ ACH (Achievement)

Race experience.

Calculated from

- Number of races
- PBs
- Badges
- Medals

---

🌍 EXP (Explorer)

Adventure score.

Calculated from

- Number of unique routes
- Cities
- Parks
- Different locations

---

📈 PRG (Progress)

Improvement over time.

Calculated from

- Pace improvement
- Distance improvement
- Consistency trend

---

🎧 VIB (Vibes)

Purely for fun 😆

Calculated from

- Running time
- Playlist usage (optional)
- Mood archetype
- Runner Type

Not performance-related.

---

# Example Card

```
         ⭐ 89 OVR

      THE LONG RUNNER

⚡ PAC    84
🫀 END    95
🎯 CON    90
❤️ REC    87
🦿 CAD    92
⛰️ CLB    81
🔥 HUS    94
🎖️ ACH    76
🌍 EXP    79
📈 PRG    91
```

---

# Fun Hidden Badges

Award badges based on activity patterns.

## 🏅 Pace Machine

Pace variation <5%

---

## 🚀 Negative Split King

Second half faster than first.

---

## ❤️ Zone 2 Enjoyer

70%+ of run spent in Zone 2.

---

## 🌅 Sunrise Warrior

Most runs before 7 AM.

---

## 🌙 Night Owl

Most runs after 8 PM.

---

## 🏔 Hill Crusher

Top 10% elevation gain.

---

## 🔥 Streak Master

7+ consecutive running days.

---

## 🎯 PB Hunter

Frequent personal bests.

---

## ☕ Coffee Runner

Stops near cafés after runs (optional if location analysis is added).

---

# Overall Rating Formula

```
OVR =
20% Pace
20% Endurance
15% Consistency
10% Cadence
10% Recovery
10% Progress
10% Achievement
5% Explorer
```

Adjust the weights based on the detected runner archetype. For example:

- **The Long Runner** → Endurance contributes more to OVR.
- **The Bling Runner** → Achievement contributes more.
- **The Trendy Runner** → Add a "Drip" or "Style" stat instead of Explorer.
- **The Club Runner** → Replace Explorer with "Community."
- **The Mood Boosting Runner** → Replace Achievement with "Vibes."

This makes each archetype feel unique while using the same underlying FIT data.