# Melody strategies

Execute via `ableton-midi` (see `examples.md` recipe 2 for a contour melody).

## Creating Melodies 1: Contour (the shape)
**Contour** = the shape of a melody over time. Two axes:
- **Direction**: rise / fall / stay.
- **Motion type**: **conjunct** (by step, adjacent notes) vs **disjunct** (by leap).

Guidelines for strong, hummable melodies:
- **Balance** rise vs fall and step vs leap. If it rises a while, let it fall by a
  similar amount.
- After moving **by step**, a **leap in the opposite direction** is often good — and
  vice versa (leap, then step back). Exception: pure chord arpeggiation can leap
  freely (the leaps sound "complete").
- **One peak note**: the highest pitch occurs **once**, ideally on a **strong beat**
  (in 4/4, beats 1 & 3 are strong; odd-numbered subdivisions are stronger than even).
- Overall a good melody often forms an **arc**: climb from the low note to the peak
  near the midpoint, then descend. (Most real melodies bend these rules — aim for
  balance, not strict obedience.)

## Creating Melodies 2: Using Motives (structure)
- A **motive** is the smallest recognizable melodic fragment. Melodies are often
  built from just **one or two motives**, repeated and **varied** (transpose,
  invert, embellish, change rhythm). E.g. Daft Punk "Doin' It Right" = variations of
  a single 5-note motive; the whole melody still forms an arc.
- Recipe: write a short motive, then generate the melody by varying it — identical
  repeats build familiarity, varied repeats add interest. (See Creating Variation 3:
  Note Transformations for variation types.)

## Multiple Simultaneous Melodies (counterpoint)
Two+ independent, simultaneous melodies = **counterpoint** (each part could stand
alone as a melody). To keep lines independent:
- **Rhythmic independence**: parts should move at *different* times — when both move
  together our ear hears chords, not lines. Have one voice move while the other sustains.
- **Contrary motion**: voices mostly move in opposite directions.
- **Be careful crossing voices**: keep each part in its own range; brief crossings
  are fine, but constant winding loses independence (distinct timbres help if you do cross).

## Linear Rhythm in Melodies (hocket)
**Hocket** = split a single melodic line across 2+ instruments so no two play at
once (melodic equivalent of linear drumming). Works best at fast tempos with
fast-attack sounds. Recipe: duplicate the part to a second instrument, then delete
notes from each so the melody alternates between them (every other note, every
quarter, or arbitrary groupings). Gives a simple melody a cascade of changing timbres.

## Sound-Color Melody (Klangfarbenmelodie)
Distribute one melody (or even one pitch) across multiple instruments for timbral
variety — like hocket but **slow and seamless** (one voice fades in as another fades
out). Good for slow melodies that feel static. Recipe: split by pitch range (high
notes → instrument A, low → instrument B) or layer instruments with **mirrored
volume envelopes** (fast-attack + slow-attack) so the color shifts across each note.

## The Rhythm of Lyrics (scansion)
For vocal melodies, align musical stress with the text's natural stress
(**scansion**: mark each syllable strong `/` or weak `*`). Put **strong syllables on
strong beats** (and reinforce with longer/louder/higher notes), weak on weak — this
sounds natural; reversing it sounds forced. Hip-hop deliberately fights the text
rhythm with syncopation; that's a conscious choice.

→ **Execute:** `ableton-midi` — write contour/motive note arrays, use `degreeToPitch`
to stay in key, split parts across tracks for hocket / sound-color.
