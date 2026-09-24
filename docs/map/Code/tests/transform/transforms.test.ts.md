---
id: tests/transform/transforms.test.ts
type: test
file: tests/transform/transforms.test.ts
area: tests
---

# tests/transform/transforms.test.ts

*Test file* · area [[tests]] · 384 lines

## Test cases
- **compute**
  - creates a new numeric variable with syntax and integer formatting
  - IF condition keeps old values of an existing variable and sysmis for new ones
  - user-missing income becomes sysmis in arithmetic
  - creates string variables sized to the longest value
  - validates names and types with the failing field
  - previews the first rows
- **recode**
  - recodes into a different variable; first matching rule wins; ranges include user-missing but MISSING catches it first when listed first
  - recode into same keeps unmatched values
  - ELSE and COPY; unmatched into different is missing
  - string to numeric
  - convert numeric strings with COPY
  - rejects ranges for strings and type mismatches
  - condition limits the recode
- **automatic recode**
  - maps sorted values to 1..k with labels, user-missing last
  - keeps existing value labels of numeric sources
- **reverse coding and scales**
  - detects the range from labels, ignoring missing codes
  - reverses values and labels into new variables; missing codes unchanged
  - replaces in place
  - scale mean with minimum valid items
- **standardize**
  - z-scores with sample SD, respecting weights
- **binning**
  - assigns bins with upper cutpoints included by default
  - labels integer groups the way people write them
  - custom cutpoints with counts
  - equal width and equal count
- **count values**
  - counts matches per case
- **select cases**
  - filters with filter_$ like SPSS
  - deletes unselected cases
  - random samples are reproducible; exact n is exact
- **sort, weight, rank**
  - stable multi-key sort with sysmis first
  - weight checks and warnings
  - ranks with ties
- **merge files**
  - add cases matches variables by name, merges labels, keeps type conflicts apart
  - add variables by key (one-to-one), including unmatched cases from the second file
  - lookup table: many cases per key
  - add variables by case order
- **aggregate**
  - adds group means to every case
  - creates a new dataset with one case per group
- **log items**
  - builds a transform output item

## Imports
- [[core/data.ts]] · value
- [[transform/index.ts]] · value
- [[transform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[merge.ts#addCases|addCases()]]
- [[merge.ts#addVariables|addVariables()]]
- [[aggregate.ts#aggregate|aggregate()]]
- [[recode.ts#autoRecode|autoRecode()]]
- [[binning.ts#binLabels|binLabels()]]
- [[binning.ts#binOf|binOf()]]
- [[cases.ts#checkWeightVariable|checkWeightVariable()]]
- [[transform/helpers.ts#col|col()]]
- [[binning.ts#computeCutpoints|computeCutpoints()]]
- [[compute.ts#computeVariable|computeVariable()]]
- [[derive.ts#countValues|countValues()]]
- [[derive.ts#createScale|createScale()]]
- [[derive.ts#detectScaleRange|detectScaleRange()]]
- [[transform/helpers.ts#ds|ds()]]
- [[binning.ts#previewBins|previewBins()]]
- [[compute.ts#previewCompute|previewCompute()]]
- [[derive.ts#rankCases|rankCases()]]
- [[derive.ts#rankColumn|rankColumn()]]
- [[recode.ts#recodeDifferent|recodeDifferent()]]
- [[recode.ts#recodeSame|recodeSame()]]
- [[recode.ts#recodeValue|recodeValue()]]
- [[derive.ts#reverseCode|reverseCode()]]
- [[cases.ts#selectCasesTransform|selectCasesTransform()]]
- [[cases.ts#selectionValues|selectionValues()]]
- [[cases.ts#sortCases|sortCases()]]
- [[derive.ts#standardize|standardize()]]
- [[log.ts#transformLogItem|transformLogItem()]]
- [[transform/helpers.ts#vid|vid()]]
- [[binning.ts#visualBin|visualBin()]]
- [[cases.ts#weightCases|weightCases()]]

## Uses
- [[compute.ts#ComputeError|ComputeError]]

## Tests
- [[Transforms/aggregate|aggregate]] · transform id
- [[Transforms/binning|binning]] · transform id
- [[Transforms/compute|compute]] · transform id
- [[Transforms/count|count]] · transform id
- [[core/data.ts]] · import
- [[transform/index.ts]] · import
- [[Transforms/standardize|standardize]] · transform id

## Private helpers
nn() (line 11)
