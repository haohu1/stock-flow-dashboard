# Self-Care AI Treatment Capability Analysis

## Key Principle
Self-care AI effectiveness depends on whether it can guide **actual treatment** vs just providing **advice/monitoring**.

## Disease Classification

### 1. Can Guide Treatment (Higher Self-Care AI Effects)

#### Diarrhea
- **Treatment capability**: ORS preparation, zinc supplementation guidance
- **Current muIEffect**: 25% ✓ (appropriate)
- **Rationale**: AI can guide proper ORS mixing, administration schedule, zinc dosing

#### URTI (Upper Respiratory Tract Infection)
- **Treatment capability**: Symptomatic care (fluids, rest, OTC medications)
- **Current muIEffect**: 8% 
- **Recommended**: 15-20% (undervalued - can guide complete home management)

#### Fever (Simple)
- **Treatment capability**: Antipyretics dosing, cooling measures
- **Current muIEffect**: 10%
- **Recommended**: 15% (can guide appropriate fever management)

#### Anemia (Nutritional)
- **Treatment capability**: Iron supplementation, dietary guidance
- **Current muIEffect**: 8%
- **Recommended**: 12% (can guide iron dosing and dietary changes)

### 2. Advice/Monitoring Only (Lower Self-Care AI Effects)

#### Childhood Pneumonia
- **Treatment capability**: None (needs antibiotics)
- **Advice only**: Danger sign recognition
- **Current muIEffect**: 10%
- **Recommended**: 3-5% (only helps with early recognition, not treatment)

#### Malaria
- **Treatment capability**: Limited (ACTs usually prescription-only)
- **Advice only**: Prevention, early symptom recognition
- **Current muIEffect**: 15%
- **Recommended**: 5-8% (unless OTC antimalarials available)

#### Tuberculosis
- **Treatment capability**: None (needs DOTS program)
- **Advice only**: Adherence support
- **Current muIEffect**: 5% ✓ (appropriate)

#### High-Risk Pregnancy
- **Treatment capability**: None (medical condition)
- **Advice only**: Danger sign recognition
- **Current muIEffect**: 3% ✓ (appropriate)

#### CHF (Congestive Heart Failure)
- **Treatment capability**: None (needs medical management)
- **Advice only**: Weight monitoring, medication reminders
- **Current muIEffect**: 1.5%
- **Recommended**: 0% (no resolution possible without medical care)

#### HIV Management
- **Treatment capability**: None (needs ART)
- **Advice only**: Adherence support
- **Current muIEffect**: 20%
- **Recommended**: 5-8% (adherence helps but doesn't resolve)

### 3. Mixed Capability

#### HIV Opportunistic Infections
- **Treatment capability**: Varies by infection type
- **Current approach**: Not specified
- **Recommended**: 5% (weighted average - most need medical care)

## Summary of Changes Made

| Disease | Previous | Updated | Rationale |
|---------|----------|---------|-----------|
| **CHF** | 1.5% | **0%** | No informal care resolution possible - needs medical management |
| **URTI** | 8% | **18%** | Can guide complete home treatment (fluids, rest, OTC meds) |
| **Fever** | 10% | **15%** | Can guide antipyretic dosing and cooling measures |
| **Anemia** | 8% | **12%** | Can guide iron supplementation dosing |
| **Childhood Pneumonia** | 10% | **5%** | No treatment capability - only danger sign recognition |
| **Malaria** | 15% | **8%** | Limited OTC treatment - mainly prevention/recognition |
| **HIV Management** | 20% | **8%** | Adherence support only - ART is prescription |
| **HIV Opportunistic** | None | **5%** | Mixed - some treatable (thrush), most need medical care |
| **Diarrhea** | 25% | 25% | Already appropriate - ORS preparation guidance |
| **TB** | 5% | 5% | Already appropriate - adherence support only |
| **High-risk pregnancy** | 3% | 3% | Already appropriate - danger signs only |

## Implementation Notes

1. **High effects (15-25%)**: Conditions where AI can guide complete home treatment
2. **Medium effects (8-12%)**: Conditions where AI can guide partial treatment or supplementation
3. **Low effects (3-8%)**: Conditions where AI provides adherence support or recognition only
4. **Zero effects (0%)**: Conditions requiring medical care with no informal resolution possible