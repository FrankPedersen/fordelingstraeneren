# Guide to Suit Combinations – Analysis

Updated 21 October 2026

The analysis finds the line in one suit that gives the best chance of the tricks you need, and calculates it exactly against best defence. On 11 combinations from the bridge literature it finds the books' line or a better one.

## 1 Introduction and the app

Suit combinations is a track in Fordelingstræneren that teaches you to play one suit as well as possible. The analysis is the track's tool: you choose the cards and the goal, and it shows the best lines with their chance, the average number of tricks and the layouts the lines win and lose on.

The app is at [www.kontraktbridge.dk/fordelingstraeneren](https://www.kontraktbridge.dk/fordelingstraeneren/) and works in all modern browsers, also on phones and tablets. It can be installed as an app and used offline.

The analysis is in two places: as the Analysis tab in Suit combinations and as the separate module Analysis on the front page ([www.kontraktbridge.dk/fordelingstraeneren/#analyse](https://www.kontraktbridge.dk/fordelingstraeneren/#analyse)). It is the same analysis with the same data, so a line of your own that you save in one place is also in the other. The Guide button at the top of the analysis opens this guide.

Suit combinations has three tabs:

| Tab | What you do | When the answer is shown |
| --- | --- | --- |
| Training | Solve tasks that the app chooses with the Leitner system | After you have chosen a line and guessed the chance |
| Free practice | Choose the technique, number of cards, missing honours and goal yourself | After you have chosen a line |
| Analysis | Choose a combination and see the solution | At once |

The bank has 657 combinations from the classic suit combinations, inspired by Suit Combinations in Bridge (Jethalal M. Shah), ordered by how often they occur at the table. The analysis shows the bank's combinations at once, because the solutions are worked out in advance. Other combinations are worked out in the browser when you ask for it.

## 2 Using the analysis

### 2.1 Analyse a combination

You tap the cards into the card picker for dummy (North) and your hand (South) and choose the goal in tricks. The cards you do not choose are held by the opponents. The table is shown as a classic diagram with North at the top, South at the bottom and the missing cards in the middle.

You can also paste the combination into the field "Paste a combination or a deal" above the card picker and tap Import:

| Paste | Example | Result |
| --- | --- | --- |
| Dummy-hand | `AK65-J43` or `EK65-B43` | The combination is set up at once |
| A LIN text | The text from a LIN file, starting with `md` | Choose one of the deal's 8 combinations |
| The address from BBO's hand viewer | `…handviewer.html?lin=…` or `?n=…&s=…` | Choose one of the deal's 8 combinations |

From a deal you choose each suit for North–South or East–West, and the first hand becomes dummy. English (A K Q J T) and Danish (E K D B 10) notation both work. The app only reads the text and fetches nothing from the internet.

Example: dummy has A Q J 10, your hand 6 5 4 3 2, and the goal is 5 tricks.

| Line | Chance of 5 tricks |
| --- | --- |
| Low from both hands; if West plays an honour, it is won with the ace | 50.00 % |
| The ace is cashed | 12.43 % |
| The queen from dummy; if East covers, low is played, otherwise it runs | 0 % |

Each line is on a line card with numbered steps and if/then branches. Below the steps is the line's average number of tricks. The analysis shows the best line for each first lead: all lines within 0.5 percentage points of the best one and up to three alternatives further down.

Below the lines are the assumptions, e.g. "a priori · unlimited entries · best defence". With a situation or limited entries they are shown here instead (sections 2.4 and 2.5).

### 2.2 The layouts

The probability band has one horizontal bar per line, divided into layouts by their chance. The fields are in the same order for all lines, so you can see where the lines disagree. Blue with ✓ is goal made, orange with ✕ is goal not made.

Below the band, the layouts are in a table with West, East, the chance and one column per line. The layouts where the lines give different results come first under the label "decides" with their number and total chance, e.g. "4 layouts · 25.00 %". "Show all layouts" unfolds the rest, grouped by distribution or by where the honours are. Each group has a subheading with its chance and its number of layouts, e.g. "2–2 · 40.70 % · 6 layouts" or "K · 50.00 % · 8 layouts".

A row gathers the layouts that differ only in small cards. If the opponents' cards in a gap between your cards are all 10 or higher, they are shown as they are; otherwise they are shown as x (section 4.3). The number in brackets in the East cell is the number of layouts in the row, and below the row's total chance is the chance of each of them:

| West | East | Chance |
| --- | --- | --- |
| K x | x x (3) | 20.35 % (3 × 6.78 %) |
| K x x | x (3) | 18.65 % (3 × 6.22 %) |
| K | x x x | 6.22 % |
| K x x x | – | 4.78 % |

In the example with A Q J 10 opposite 6 5 4 3 2, K 9 8 7 are missing, and the line "low from both hands" wins when West has the king. That is the four rows above, in short form `Kx–xx(3)`, `Kxx–x(3)`, `K–xxx` and `Kxxx–void`: 8 layouts and 50.00 % in all. The short form is also used in sentences such as "The lines disagree in …", and they count layouts, not rows.

### 2.3 Compare lines

The label "decides" shows the layouts where the lines give different results. By default the lines shown are compared.

- **Compare:** with exactly two lines ticked, the band and the table show only those two, and "decides" applies to them. Above the table you see how often each line wins alone, e.g. "Line A wins alone in 3 layouts (14.0 %), line B in 1 (6.2 %)". The difference between the two figures is the difference between the lines' chances.
- **Show all first leads:** shows every first lead, also those far below the best one and those with 0 %, e.g. "the queen from dummy". The lines shown keep their letters.
- **Your lines:** you can write your own line in the line editor and have it worked out and compared next to the solver's.

### 2.4 The situation

The panel The situation below the table uses what you know from the bidding and the play. "Set the situation" opens the fields, which are set with − and +:

| Field | West | East | Default |
| --- | --- | --- | --- |
| Known cards in other suits | 0–13 | 0–13 | 0 |
| Max. HCP in the suit | 0–10 | 0–10 | 10 |

- **Known cards** are the cards a defender has shown in the other suits. Vacant places are 13 minus the known cards (section 4.1).
- **Max. HCP** is the most high-card points in the suit (A 4, K 3, Q 2, J 1) a defender can hold, for instance because he has passed.
- **The chances are conditional:** the percentage is the chance given the situation. Excluded layouts are not shown in the band and the table, and a line says how many there are.
- **The calculation** runs in the browser, because the bank's figures are a priori. It starts by itself just after your last tap and shows the time that has passed. You can stop it.

| Dummy / hand, 5 tricks | Situation | Chance |
| --- | --- | --- |
| A Q J 10 / 6 5 4 3 2 | None | 50.00 % |
| A Q J 10 / 6 5 4 3 2 | West 5, East 2 known cards | 42.11 % |
| A Q J 10 / 6 5 4 3 2 | East max. 0 HCP | 100.00 % |
| A Q J 10 / 6 5 4 3 2 | West max. 0 HCP | 12.43 % |
| A Q J 10 / 6 5 4 3 2 | West max. 0 HCP, West 5 and East 2 known cards | 6.86 % |
| J 5 / A Q 7 6 4 2 | West max. 0 HCP | 84.78 % (the jack from dummy) |

Play it yourself, opened from Analysis, deals only layouts that are possible in the situation. The training task type "With counting" uses the same vacant places.

### 2.5 Entries

By default the entries are unlimited: declarer leads from whichever hand he likes, as in the bank. In the panel The situation you can set, in the block Entries, how many sure entries North and South have in the other suits, and which hand is on lead:

| Field | Choices | Default |
| --- | --- | --- |
| Entries to North | 0–5 or unlimited | Unlimited |
| Entries to South | 0–5 or unlimited | Unlimited |
| On lead | North or South | South |

The field On lead is shown only when a hand has limited entries. The rules are:

- **A lead from the hand on lead** is free. A lead from the other hand uses an entry to that hand. Without entries you cannot lead from there.
- **If you win the trick,** the hand with the winning card is on lead.
- **If the defenders win the trick,** neither hand is on lead, and the next lead uses an entry, whichever hand you lead from.
- **Many entries are the same as unlimited:** a hand with at least as many entries as it has cards counts as unlimited. If both hands do, the bank's figures are used.

Your choices are shown as chips below the table, e.g. "South on lead · South 2 entries", and in the assumptions, e.g. "a priori · South on lead, North unlimited and South 2 entries · best defence". A lead that uses an entry appears in the line as e.g. "Hand is reached with a side entry, and low is led to the ace." A line of your own that leads from a hand without an entry is rejected with a message saying which step it is. In Play it yourself, opened from Analysis, the entries are counted down, and the buttons for a hand that cannot be reached are greyed out.

The blocked suit shows what the entries mean. Dummy has the ace alone, and your hand has K Q J 3 2:

| Entries | 4 tricks | 5 tricks |
| --- | --- | --- |
| Unlimited | 100.00 % | 62.17 % |
| North on lead, South 0 entries | 0.00 % | 0.00 % |
| South on lead, North and South 0 entries | 0.00 % | 0.00 % |
| North on lead, South 1 entry | 100.00 % | 62.17 % |
| South on lead, South 1 entry | 100.00 % | 62.17 % |

The ace has to go before your hand can take its tricks, and then it takes one entry to the hand. Without it you make one trick.

With A Q J 10 opposite 6 5 4 3 2, 5 tricks, South on lead and North unlimited, the chance depends on the entries to your hand:

| Entries to South | Chance of 5 tricks |
| --- | --- |
| 1 | 26.57 % |
| 2 | 45.22 % |
| 3 or unlimited | 50.00 % |

With two entries the line loses only the layout Kxxx–void (4.78 %), because the finesses and the last small card from hand take three entries to the hand. With one entry it wins only when West has the king singleton or K x.

### 2.6 What now?

After the first round a card has fallen, and you must choose how to continue. The task type uses the solver's chances after what has been seen, and this is where restricted choice is trained. If East drops the queen under the ace with dummy A K 10 3 2 and your hand 7 6 5 4, the finesse against the jack wins 64.7 %.

### 2.7 Play it yourself

You play the combination trick by trick against rule-based defence. Second hand plays low and covers 10 or higher with the cheapest card that beats it. Fourth hand wins as cheaply as possible. The current layout lights up in the band. Opened from Analysis with limited entries, the table shows which hand is on lead and how many entries are left, e.g. "North on lead · South 0 entries".

### 2.8 Teams or pairs

Some combinations have one best line for teams (the chance of the goal) and another for pairs (the most tricks on average). The task type "Teams or pairs" shows both lines and what the safety play costs in tricks.

## 3 Examples

The table shows the solver's result for 11 combinations, most of them from the bridge literature. All solutions are certified optimal (section 4.5), and the percentages agree to two decimals with an independent calculation.

| Dummy | Hand | Goal | Best line | Chance | Source |
| --- | --- | --- | --- | --- | --- |
| A Q J 10 | 6 5 4 3 2 | 5 | Low from both hands | 50.00 % | Example |
| A Q J 10 | 6 5 4 3 2 | 5 | Same, side suit 5-2 with West | 42.11 % | Example |
| J 5 | A Q 7 6 4 2 | 5 | The jack from dummy | 76.30 % | Kelsey |
| J 5 | A Q 7 4 3 2 | 5 | The ace is cashed | 73.48 % | Kelsey |
| Q 10 4 | A 9 8 6 3 2 | 5 | Low towards the 10 | 81.35 % | Dormer |
| Q 10 4 | A 8 7 6 3 2 | 5 | The ace is cashed | 78.00 % | Dormer |
| A 5 | J 10 6 4 3 | 3 | The ace is cashed | 66.21 % | Kelsey |
| J 6 5 | A K 7 2 | 3 | Low to the ace | 72.04 % | Villy Dam |
| K Q J 6 | 8 7 3 | 3 | Low towards the king | 70.83 % | Villy Dam |
| Q J 6 | A 7 4 2 | 3 | Low towards the queen | 70.83 % | Root |
| A J 8 | 10 3 2 | 2 | The 10 from hand | 39.66 % | Encyclopedia |

Three of the examples show what the analysis can be used for:

- **The standard line is not always best.** With J 5 opposite A Q 7 6 4 2, Kelsey recommends the ace first (73.48 %). The jack from dummy gives 76.30 %, because it also wins against a singleton 8, 9 or 10 with West. Swap the 6 for the 3, and the ace is best again.
- **The middle cards decide.** With Q 10 4 opposite A 9 8 6 3 2, low towards the 10 gives 81.35 % against 78.00 % for the ace first. Swap the 9 for the 7, and the ace first is best.
- **Small improvements are found too.** With A J 8 opposite 10 3 2, the Encyclopedia gives 39 % for low towards the 8. The 10 from hand gives 39.66 % against 38.70 %.

The four examples on restricted choice (Kelsey, Villy Dam and Root) are about what happens after the first or second round. In Suit combinations that is the task type "What now?".

## 4 The calculation model

The solver treats a suit combination as a game between two sides with hidden information and solves it exactly. Declarer sees only the cards played, the defenders know all the cards, and the result is the line that gives the best chance against the best defence. No percentage is typed in; everything is worked out from the cards.

### 4.1 Layouts and their weight

The suit is missing n cards. A layout is a specific division of them between West and East, so there are 2ⁿ layouts. If West holds k particular cards, the chance is

`P = C(U − n, v_W − k) / C(U, v_W), where U = v_W + v_E`

Here C(a, b) is the number of ways to choose b out of a, and v_W and v_E are the vacant places with West and East. With no other information both are 13. If the number of cards in other suits is known, they are subtracted. With four missing cards the formula gives 6.78 % per specific 2-2 layout, 6.22 % per 3-1 and 4.78 % per 4-0.

The chances are calculated as exact fractions with big integers, so no rounding errors arise along the way.

### 4.2 The game

Declarer controls North and South and wants to maximise the chance of the goal. The defenders want to minimise it. The game has five kinds of nodes: lead, second hand, third hand, fourth hand and end. At the lead and third hand declarer decides, at second and fourth hand a defender.

Two rules make the model realistic:

- **Declarer sees only the cards played.** Two layouts that look the same to him get the same decision. That is why double dummy is not used: it chooses the lucky play in each layout and gives figures that are too high.
- **The defenders know all the cards and mix their choices.** A fixed set of rules for the defence can be exploited by the solver. With A 10 8 x opposite K J 9 x, rule-based defence gives 100 % for 4 tricks, against about 53 % in reality.

Restricted choice follows by itself. With K Q, East plays each honour half the time. With the singleton queen he has no choice. That is why the finesse wins 64.7 % when the queen falls, with dummy A K 10 3 2 and your hand 7 6 5 4.

**With limited entries,** which hand is on lead and the number of entries are part of the state of the game. At the lead declarer can choose only the hands that can be reached, and a lead from the other hand counts its entries down. Who is on lead and the entries are public, so they do not change what declarer and the defenders know. Without limits the game is exactly as in the bank. If no hand with cards can be reached, the game ends with the tricks won.

### 4.3 Gaps and equal cards

The opponents' cards that lie between two of declarer's cards are equal. They form a gap. All that matters is how many cards West and East have in each gap. Declarer's own equal cards are also treated as one. This makes the game tree many times smaller without changing the value of the game.

The tree distinguishes between nodes and items. A node is what declarer knows: the cards played. An item is a node together with one layout: what the defenders know. The nodes are numbered depth-first, so a subtree takes up a contiguous interval.

**With an HCP limit the gaps are split.** If a limit for max. HCP is set and it binds, the cards in a gap are no longer equal: West with the king may be excluded, while West with the 9 is possible. Each gap is therefore split by high-card points, so A, K, Q and J each stand alone, and the 10 and lower stand together. The parts are kept apart throughout the game, also when two gaps merge because declarer has played the card between them. At the table declarer sees which honour fell, and so he does in the solver.

A layout's weight is the a priori weight with the vacant places when both defenders' HCP lie within the limits, otherwise 0. The denominator is the sum of the weights, so the chances become conditional. Without a binding limit nothing is split, and the game is exactly as before.

### 4.4 Solving with CFR+

The game is solved with CFR+ (counterfactual regret minimization). Both sides play through the tree again and again and shift weight towards the choices they regret not having made. The average of the strategies approaches the equilibrium, where neither side can do better.

Along the way two figures give bounds on the true value:

| Bound | How it is found |
| --- | --- |
| Lower | The defenders' best response to declarer's average strategy |
| Upper | Declarer's best response to the defenders' average strategy |

Each first lead is a separate subgame, because the lead is public. The solver therefore finds the best line for each lead separately. The best of them is the value of the combination, and the others are the alternatives. The solver stops after at most 20,000 iterations.

### 4.5 Certification

The solver looks for a pure line: one particular choice in each of declarer's nodes. The line's guarantee is calculated exactly: in each layout the defenders choose what is worst for declarer. If the guarantee lies within 0.002 percentage points of the upper bound, the line is proved optimal, and the exact guarantee is the result.

If the optimal play requires declarer to mix, for instance whether to cover an honour, there is no pure line. The solver then stops when the bounds lie within 0.01 percentage points, and the value is the middle of them. The result is marked not certified.

### 4.6 Goal and pairs

For teams, the chance of making the goal, P(tricks ≥ goal), is maximised. For pairs, the expected number of tricks is maximised. The same solver handles both; only the payoff in the end nodes changes from 1/0 to the number of tricks.

Lines within 0.5 percentage points of the best one count as equally good. The limit comes from the sources, which give whole percentages only.

### 4.7 From strategy to text

The solver's result is a strategy tree. It is turned into a short main line and the branches that are needed, with fixed sentence templates, e.g. "The jack from dummy; if East covers, the trick is won with the ace, otherwise it runs". If a lead uses an entry, the step begins with "Hand is reached with a side entry" or "Dummy is reached with a side entry". The steps are descriptive, e.g. "The ace is cashed." Each template exists in Danish and English. After the last step of the line the solver plays the rest optimally from what has been seen.

### 4.8 Frequency

The tasks come in order of how often the combination occurs at the table. The frequency is the chance per deal that you and partner hold the combination in one of the four suits:

`P = C(39, 13 − a) · C(26 + a, 13 − b) / (C(52, 13) · C(39, 13)) · w · 4 · s`

Here a and b are the number of cards in your hand and in dummy, w the number of ways to choose the small cards, and s = 2 when hand and dummy differ. The app shows the figure as a natural frequency, e.g. "about every 5th club evening" (25 deals).

### 4.9 Assumptions and limits

| Assumption | Today |
| --- | --- |
| Chances | A priori, or conditional on the situation: known cards and max. HCP |
| Entries | Unlimited in the bank. In Analysis the entries to North and South and which hand is on lead can be set; the entries are sure |
| The defenders | Never play the suit themselves, not even to take out an entry |
| Missing cards | Up to 8 |

The bank's 657 combinations are worked out in advance, a priori and with unlimited entries, with `scripts/solve.ts`. Other combinations and all situations are worked out in the browser in a Web Worker, so the app does not freeze.

The calculation time can be long. Measured in Node on a laptop for one goal (3 tricks):

| Combination | Situation | Nodes | Median | Chance |
| --- | --- | --- | --- | --- |
| Q J 6 / A 7 4 2 | None | 759,405 | 246 s | 70.83 % |
| Q J 6 / A 7 4 2 | West max. 2 HCP | 800,765 | 188 s | 45.22 % |
| Q J 6 / A 7 4 2 | South on lead, North 1 and South 1 entry | 404,545 | 60 s | 44.81 % |
| A 10 3 2 / K 9 5 4 | None | 269,343 | 21.3 s | 94.35 % |
| A 10 3 2 / K 9 5 4 | West max. 2 HCP | 593,365 | 45.5 s | 100.00 % |

Splitting the gaps makes the tree from 5 % to 2.2 times larger, and the time follows the tree. With limited entries the tree is at most 2 % larger than without and often smaller, because the entries cut lines away. On a phone it takes longer.

### 4.10 Validation

The solver has been checked against four sources:

| Source | Scope | Result |
| --- | --- | --- |
| Acceptance tests in Vitest | J432 / A1065, drop or finesse, restricted choice, entries and more | All pass |
| The classic suit combinations (inspiration: Suit Combinations in Bridge, Jethalal M. Shah) | All usable cases, both readings of x | 14 goals and 3 cases removed as errors in the source; the rest use the solver's figures |
| The Official Encyclopedia of Bridge | 55 combinations, 92 goals, 28 averages | Within 0.5 percentage points, known differences documented |
| Independent calculation | 11 examples | Same percentage to two decimals in all |

The classic suit combinations give x as small cards without saying whether declarer's x's are the lowest. The validation report calculates both readings, and the app uses "low": declarer's x's are the lowest cards.

## 5 Strengths and limitations

The model is exact: it proves that the line is optimal against the best defence, also with a situation and limited entries. The remaining limitations are the calculation time and two assumptions: the entries in the other suits are sure, and the defenders never play the suit.

| Topic | Today |  |
| --- | --- | --- |
| Method | Game with hidden information, solved with CFR+ | Strength |
| Guarantee | Certified optimal line, or bounds of 0.01 percentage points | Strength |
| Defence | Optimal and mixed; knows all the cards | Strength |
| Restricted choice | Follows from the defenders' mixed choices | Strength |
| Pairs | Most tricks on average and "Teams or pairs" | Strength |
| Frequency | Per deal and per club evening | Strength |
| The situation | Known cards and max. HCP with West and East, exact | Strength |
| Entries | Entries to North and South (0–5 or unlimited) and which hand is on lead, exact | Strength |
| Layouts | Compact notation with number and chance per layout | Strength |
| Input | Card picker, the bank's combinations and import of text, LIN and BBO addresses | Strength |
| Comparison | Two chosen lines with unique winners; all first leads | Strength |
| Side entries | Counted as sure; the defenders cannot take them out and never play the suit | Limitation |
| Calculation time | 3–4 min. in Node for the heaviest combinations | Limitation |

## 6 Extensions

The analysis has been extended in several rounds:

| Released | Extension | Section |
| --- | --- | --- |
| 18 October 2026 | The situation, import of text, LIN and BBO addresses, and choice of lines | 2.1, 2.3 and 2.4 |
| 20 October 2026 | Compact notation for layouts | 2.2 |
| 21 October 2026 | Limited entries | 2.5 |
| 21 October 2026 | Analysis as a separate module | 1 |

There are no planned extensions at the moment.
