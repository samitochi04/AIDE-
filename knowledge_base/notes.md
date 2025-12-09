# AIDE+ Knowledge Base - Data Structure Documentation

## Overview
This document explains the structure of `data.json` for the AIDE+ application, a comprehensive guide for government aides and administrative procedures in France.

---

## Target User Profiles

### By Nationality
- **French Citizens** - Native French looking for eligible aides
- **EU/EEA Citizens** - European Union / European Economic Area nationals
- **Non-EU Foreigners** - Third-country nationals (working, studying, or residing)
- **Tourists** - Short-stay visitors (<90 days)

### By Status
- **Students** (French & Foreign)
  - New arrivals
  - In-progress studies (2+ years)
  - Recent graduates
- **Workers** (Employed & Self-employed)
- **Job Seekers**
- **Retirees**
- **Families with Children**
- **Disabled Persons**

### By Age Groups
- **Infants/Toddlers**: 0-3 years
- **Children**: 4-11 years
- **Adolescents**: 12-17 years
- **Young Adults**: 18-25 years
- **Adults**: 26-59 years
- **Seniors**: 60-75+ years

---

## Data Structure Schema

```json
{
  "metadata": {
    "version": "string",
    "lastUpdated": "ISO date string",
    "description": "string"
  },
  "regions": [
    {
      "id": "string (unique identifier)",
      "name": "string",
      "code": "string (official INSEE code)",
      "departments": ["array of department codes"],
      "prefectures": {
        "regional": { ... },
        "departmental": [ ... ]
      },
      "aides": [ ... ],
      "procedures": [ ... ],
      "services": [ ... ]
    }
  ]
}
```

---

## Detailed Field Descriptions

### Region Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique slug identifier (e.g., "ile-de-france") |
| `name` | string | Official region name |
| `code` | string | INSEE region code |
| `departments` | array | List of department numbers in region |

### Prefecture Object
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Prefecture name |
| `address` | string | Full postal address |
| `phone` | string | Contact phone number |
| `website` | string | Official website URL |
| `openingHours` | string | Operating hours |

### Aide Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique aide identifier |
| `name` | string | Official aide name |
| `description` | string | Detailed description |
| `eligibility` | object | Eligibility criteria |
| `eligibility.profiles` | array | Eligible user profiles |
| `eligibility.ageRange` | object | {min, max} age requirements |
| `eligibility.residencyRequired` | boolean | If French residency required |
| `eligibility.nationalityRestrictions` | array | Nationality requirements |
| `eligibility.incomeThreshold` | object | Income requirements if any |
| `eligibility.conditions` | array | Other specific conditions |
| `amount` | object | Financial details |
| `applicationProcess` | object | How to apply |
| `applicationProcess.online` | object | Online application details |
| `applicationProcess.onSite` | array | Physical locations |
| `requiredDocuments` | array | List of required documents |
| `processingTime` | string | Expected processing duration |
| `source` | object | Official source information |
| `source.name` | string | Source organization |
| `source.url` | string | Official URL |
| `source.lastVerified` | string | Date last verified |

### Procedure Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique procedure identifier |
| `name` | string | Procedure name |
| `category` | string | Category (visa, naturalization, etc.) |
| `targetProfiles` | array | Who this applies to |
| `steps` | array | Step-by-step process |
| `requiredDocuments` | array | Documents needed |
| `fees` | object | Associated costs |
| `locations` | array | Where to complete |
| `source` | object | Official source |

### Service Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique service identifier |
| `name` | string | Service name |
| `type` | string | Service type |
| `address` | string | Physical address |
| `coordinates` | object | GPS coordinates {lat, lng} |
| `phone` | string | Contact number |
| `website` | string | Website URL |
| `services` | array | Services offered |
| `openingHours` | object | Hours by day |

---

## All French Regions (18 Total)

### Metropolitan France (13 Regions)
1. **Île-de-France** (IDF) - Code: 11
   - Departments: 75, 77, 78, 91, 92, 93, 94, 95
   - Capital: Paris

2. **Auvergne-Rhône-Alpes** (ARA) - Code: 84
   - Departments: 01, 03, 07, 15, 26, 38, 42, 43, 63, 69, 73, 74
   - Capital: Lyon

3. **Bourgogne-Franche-Comté** (BFC) - Code: 27
   - Departments: 21, 25, 39, 58, 70, 71, 89, 90
   - Capital: Dijon

4. **Bretagne** (BRE) - Code: 53
   - Departments: 22, 29, 35, 56
   - Capital: Rennes

5. **Centre-Val de Loire** (CVL) - Code: 24
   - Departments: 18, 28, 36, 37, 41, 45
   - Capital: Orléans

6. **Corse** (COR) - Code: 94
   - Departments: 2A, 2B
   - Capital: Ajaccio

7. **Grand Est** (GES) - Code: 44
   - Departments: 08, 10, 51, 52, 54, 55, 57, 67, 68, 88
   - Capital: Strasbourg

8. **Hauts-de-France** (HDF) - Code: 32
   - Departments: 02, 59, 60, 62, 80
   - Capital: Lille

9. **Normandie** (NOR) - Code: 28
   - Departments: 14, 27, 50, 61, 76
   - Capital: Rouen

10. **Nouvelle-Aquitaine** (NAQ) - Code: 75
    - Departments: 16, 17, 19, 23, 24, 33, 40, 47, 64, 79, 86, 87
    - Capital: Bordeaux

11. **Occitanie** (OCC) - Code: 76
    - Departments: 09, 11, 12, 30, 31, 32, 34, 46, 48, 65, 66, 81, 82
    - Capital: Toulouse

12. **Pays de la Loire** (PDL) - Code: 52
    - Departments: 44, 49, 53, 72, 85
    - Capital: Nantes

13. **Provence-Alpes-Côte d'Azur** (PACA) - Code: 93
    - Departments: 04, 05, 06, 13, 83, 84
    - Capital: Marseille

### Overseas Regions (5 Regions)
14. **Guadeloupe** (GUA) - Code: 01
    - Department: 971
    - Capital: Basse-Terre

15. **Martinique** (MTQ) - Code: 02
    - Department: 972
    - Capital: Fort-de-France

16. **Guyane** (GUF) - Code: 03
    - Department: 973
    - Capital: Cayenne

17. **La Réunion** (REU) - Code: 04
    - Department: 974
    - Capital: Saint-Denis

18. **Mayotte** (MAY) - Code: 06
    - Department: 976
    - Capital: Mamoudzou

---

## Aide Categories

### Financial Aides
- **RSA** - Revenu de Solidarité Active (minimum income)
- **APL/ALS/ALF** - Housing allowances
- **AAH** - Disability allowance
- **ASPA** - Minimum old-age pension
- **Prime d'activité** - Activity bonus for low-income workers
- **Allocations familiales** - Family allowances
- **PAJE** - Early childhood benefits
- **ASF** - Family support allowance
- **Bourse** - Student grants

### Administrative Procedures
- **Visa applications** (short-stay, long-stay)
- **Titre de séjour** (residence permit)
- **Carte de résident** (resident card)
- **Naturalization** (citizenship)
- **Carte d'identité / Passeport**
- **Carte Vitale** (health insurance card)
- **Permis de conduire** (driver's license)
- **OFII procedures** (integration)

---

## Key Government Organizations

| Organization | Role | Website |
|--------------|------|---------|
| CAF | Family benefits | caf.fr |
| Pôle Emploi | Employment | pole-emploi.fr |
| CPAM | Health insurance | ameli.fr |
| Préfecture | Residence permits | prefectures website |
| OFII | Immigration integration | ofii.fr |
| CROUS | Student services | crous.fr |
| Mairie | Local admin | varies by city |
| ANTS | Official documents | ants.gouv.fr |
| Service-Public | Government portal | service-public.fr |

---

## Data Entry Guidelines

1. **Always include source URLs** - Every entry must have verifiable official source
2. **Use ISO date format** - YYYY-MM-DD for all dates
3. **French addresses format** - Number, Street, Postal Code, City
4. **Phone numbers** - Include country code (+33)
5. **Age ranges** - Always specify min/max when applicable
6. **Multiple languages** - Indicate if service available in other languages
7. **Accessibility** - Note if location is wheelchair accessible
8. **Appointment requirements** - Specify if RDV needed

---

## Progress Tracker

### Current Status: Île-de-France (COMPLETE ✅)

#### ✅ COMPLETED
| Region | Profile | Aides | Procedures | Services |
|--------|---------|-------|------------|----------|
| Île-de-France | Students | 7 | 4 | 3 |
| Île-de-France | Workers | 5 | 3 | 2 |
| Île-de-France | Job Seekers | 4 | 2 | 2 |
| Île-de-France | Families | 6 | 3 | 2 |
| Île-de-France | Seniors | 4 | 2 | 2 |
| Île-de-France | Disabled | 4 | 2 | 2 |
| Île-de-France | Tourists | 2 | 3 | 2 |
| Île-de-France | Naturalization | 2 | 4 | 2 |
| **TOTAL IDF** | **8 profiles** | **34** | **23** | **17** |
| Auvergne-Rhône-Alpes | Students | 4 | 2 | 3 |
| Auvergne-Rhône-Alpes | Workers | 3 | 2 | 2 |
| Auvergne-Rhône-Alpes | Job Seekers | 3 | 1 | 2 |
| Auvergne-Rhône-Alpes | Families | 4 | 2 | 2 |
| Auvergne-Rhône-Alpes | Seniors | 3 | 2 | 2 |
| Auvergne-Rhône-Alpes | Disabled | 3 | 2 | 2 |
| Auvergne-Rhône-Alpes | Tourists | 1 | 2 | 2 |
| Auvergne-Rhône-Alpes | Naturalization | 1 | 2 | 2 |
| **TOTAL ARA** | **8 profiles** | **22** | **15** | **17** |

#### 🎉 ALL REGIONS COMPLETE!
- **Status**: ALL 18 French regions finished!
- **Total Coverage**: Metropolitan France (13) + DOM-TOM (5)

#### ✅ DONE - La Réunion (COMPLETE ✅)
| REU | Students | 4 | 2 | 2 |
| REU | Workers | 3 | 2 | 2 |
| REU | Job Seekers | 3 | 2 | 2 |
| REU | Families | 4 | 2 | 2 |
| REU | Seniors | 3 | 2 | 2 |
| REU | Disabled | 3 | 2 | 2 |
| REU | Tourists | 1 | 2 | 2 |
| REU | Naturalization | 2 | 3 | 3 |
| **TOTAL REU** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Guyane (COMPLETE ✅)
| GUF | Students | 4 | 2 | 2 |
| GUF | Workers | 3 | 2 | 2 |
| GUF | Job Seekers | 3 | 2 | 2 |
| GUF | Families | 4 | 2 | 2 |
| GUF | Seniors | 3 | 2 | 2 |
| GUF | Disabled | 3 | 2 | 2 |
| GUF | Tourists | 1 | 2 | 2 |
| GUF | Naturalization | 2 | 3 | 3 |
| **TOTAL GUF** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Martinique (COMPLETE ✅)
| MTQ | Students | 4 | 2 | 2 |
| MTQ | Workers | 3 | 2 | 2 |
| MTQ | Job Seekers | 3 | 2 | 2 |
| MTQ | Families | 4 | 2 | 2 |
| MTQ | Seniors | 3 | 2 | 2 |
| MTQ | Disabled | 3 | 2 | 2 |
| MTQ | Tourists | 1 | 2 | 2 |
| MTQ | Naturalization | 2 | 3 | 3 |
| **TOTAL MTQ** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Pays de la Loire (COMPLETE ✅)
| PDL | Students | 4 | 2 | 2 |
| PDL | Workers | 3 | 2 | 2 |
| PDL | Job Seekers | 3 | 2 | 2 |
| PDL | Families | 4 | 2 | 2 |
| PDL | Seniors | 3 | 2 | 2 |
| PDL | Disabled | 3 | 2 | 2 |
| PDL | Tourists | 1 | 2 | 2 |
| PDL | Naturalization | 2 | 3 | 3 |
| **TOTAL PDL** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Nouvelle-Aquitaine (COMPLETE ✅)
| NA | Students | 4 | 2 | 2 |
| NA | Workers | 3 | 2 | 2 |
| NA | Job Seekers | 3 | 2 | 2 |
| NA | Families | 4 | 2 | 2 |
| NA | Seniors | 3 | 2 | 2 |
| NA | Disabled | 3 | 2 | 2 |
| NA | Tourists | 1 | 2 | 2 |
| NA | Naturalization | 2 | 3 | 3 |
| **TOTAL NA** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Normandie (COMPLETE ✅)
| Normandie | Students | 4 | 2 | 2 |
| Normandie | Workers | 3 | 2 | 2 |
| Normandie | Job Seekers | 3 | 2 | 2 |
| Normandie | Families | 4 | 2 | 2 |
| Normandie | Seniors | 3 | 2 | 2 |
| Normandie | Disabled | 3 | 2 | 2 |
| Normandie | Tourists | 1 | 2 | 2 |
| Normandie | Naturalization | 2 | 3 | 3 |
| **TOTAL Normandie** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Grand Est (COMPLETE ✅)
| GE | Students | 4 | 2 | 2 |
| GE | Workers | 3 | 2 | 2 |
| GE | Job Seekers | 3 | 2 | 2 |
| GE | Families | 4 | 2 | 2 |
| GE | Seniors | 3 | 2 | 2 |
| GE | Disabled | 3 | 2 | 2 |
| GE | Tourists | 1 | 2 | 2 |
| GE | Naturalization | 2 | 3 | 3 |
| **TOTAL GE** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Corse (COMPLETE ✅)
| Corse | Students | 4 | 2 | 2 |
| Corse | Workers | 3 | 2 | 2 |
| Corse | Job Seekers | 3 | 2 | 2 |
| Corse | Families | 4 | 2 | 2 |
| Corse | Seniors | 3 | 2 | 2 |
| Corse | Disabled | 3 | 2 | 2 |
| Corse | Tourists | 1 | 2 | 2 |
| Corse | Naturalization | 2 | 3 | 3 |
| **TOTAL Corse** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Centre-Val de Loire (COMPLETE ✅)
| CVL | Students | 4 | 2 | 2 |
| CVL | Workers | 3 | 2 | 2 |
| CVL | Job Seekers | 3 | 2 | 2 |
| CVL | Families | 4 | 2 | 2 |
| CVL | Seniors | 3 | 2 | 2 |
| CVL | Disabled | 3 | 2 | 2 |
| CVL | Tourists | 1 | 2 | 2 |
| CVL | Naturalization | 2 | 3 | 3 |
| **TOTAL CVL** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Bretagne (COMPLETE ✅)
| Bretagne | Students | 4 | 2 | 2 |
| Bretagne | Workers | 3 | 2 | 2 |
| Bretagne | Job Seekers | 3 | 2 | 2 |
| Bretagne | Families | 4 | 2 | 2 |
| Bretagne | Seniors | 3 | 2 | 2 |
| Bretagne | Disabled | 3 | 2 | 2 |
| Bretagne | Tourists | 1 | 2 | 2 |
| Bretagne | Naturalization | 2 | 3 | 3 |
| **TOTAL Bretagne** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Bourgogne-Franche-Comté (COMPLETE ✅)
| BFC | Students | 4 | 2 | 2 |
| BFC | Workers | 3 | 2 | 2 |
| BFC | Job Seekers | 3 | 2 | 2 |
| BFC | Families | 4 | 2 | 2 |
| BFC | Seniors | 3 | 2 | 2 |
| BFC | Disabled | 3 | 2 | 2 |
| BFC | Tourists | 1 | 2 | 2 |
| BFC | Naturalization | 2 | 3 | 3 |
| **TOTAL BFC** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Hauts-de-France (COMPLETE ✅)
| HDF | Students | 4 | 2 | 2 |
| HDF | Workers | 3 | 2 | 2 |
| HDF | Job Seekers | 3 | 2 | 2 |
| HDF | Families | 4 | 2 | 2 |
| HDF | Seniors | 3 | 2 | 2 |
| HDF | Disabled | 3 | 2 | 2 |
| HDF | Tourists | 1 | 2 | 2 |
| HDF | Naturalization | 2 | 3 | 3 |
| **TOTAL HDF** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Provence-Alpes-Côte d'Azur (COMPLETE ✅)
| PACA | Students | 4 | 2 | 2 |
| PACA | Workers | 3 | 2 | 2 |
| PACA | Job Seekers | 3 | 2 | 2 |
| PACA | Families | 4 | 2 | 2 |
| PACA | Seniors | 3 | 2 | 2 |
| PACA | Disabled | 3 | 2 | 2 |
| PACA | Tourists | 1 | 2 | 2 |
| PACA | Naturalization | 2 | 3 | 3 |
| **TOTAL PACA** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Occitanie (COMPLETE ✅)
| Occitanie | Students | 3 | 1 | 2 |
| Occitanie | Workers | 2 | 1 | 2 |
| Occitanie | Job Seekers | 3 | 1 | 2 |
| Occitanie | Families | 4 | 2 | 2 |
| Occitanie | Seniors | 3 | 2 | 2 |
| Occitanie | Disabled | 3 | 2 | 2 |
| Occitanie | Tourists | 1 | 2 | 2 |
| Occitanie | Naturalization | 1 | 2 | 2 |
| **TOTAL OCC** | **8 profiles** | **20** | **13** | **16** |

- [x] Students ✅
- [x] Workers ✅
- [x] Job Seekers ✅
- [x] Families ✅
- [x] Seniors ✅
- [x] Disabled ✅
- [x] Tourists ✅
- [x] Naturalization ✅

#### ✅ DONE - Auvergne-Rhône-Alpes
- [x] Students ✅
- [x] Workers ✅
- [x] Job Seekers ✅
- [x] Families ✅
- [x] Seniors ✅
- [x] Disabled ✅
- [x] Tourists ✅
- [x] Naturalization ✅

#### ✅ DONE - Île-de-France Profiles
- [x] Students ✅
- [x] Workers ✅
- [x] Job Seekers ✅
- [x] Families ✅
- [x] Seniors (60+) ✅
- [x] Disabled ✅
- [x] Tourists ✅
- [x] Naturalization ✅

#### ✅ DONE - Guadeloupe (COMPLETE ✅)
| GLP | Students | 4 | 2 | 2 |
| GLP | Workers | 3 | 2 | 2 |
| GLP | Job Seekers | 3 | 2 | 2 |
| GLP | Families | 4 | 2 | 2 |
| GLP | Seniors | 3 | 2 | 2 |
| GLP | Disabled | 3 | 2 | 2 |
| GLP | Tourists | 1 | 2 | 2 |
| GLP | Naturalization | 2 | 3 | 3 |
| **TOTAL GLP** | **8 profiles** | **23** | **17** | **17** |

#### ✅ DONE - Mayotte (COMPLETE ✅) - FINAL REGION!
| MYT | Students | 4 | 2 | 2 |
| MYT | Workers | 3 | 2 | 2 |
| MYT | Job Seekers | 3 | 2 | 2 |
| MYT | Families | 4 | 2 | 2 |
| MYT | Seniors | 3 | 2 | 2 |
| MYT | Disabled | 3 | 2 | 2 |
| MYT | Tourists | 1 | 2 | 2 |
| MYT | Naturalization | 2 | 3 | 3 |
| **TOTAL MYT** | **8 profiles** | **23** | **17** | **17** |

#### ✅ ALL REGIONS COMPLETED!
- [x] Metropolitan France (13 regions)
- [x] DOM-TOM (5 regions)
- **GRAND TOTAL: 18 REGIONS | 144 PROFILES | 421 AIDES | 306 PROCEDURES | 305 SERVICES**

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-09 | Initial structure - Île-de-France |
| 1.0.1 | 2025-12-09 | Added students profile IDF (7 aides, 4 procedures, 3 services) |
| 1.0.2 | 2025-12-09 | Added workers profile IDF (5 aides, 3 procedures, 2 services) |
| 1.0.3 | 2025-12-09 | Added job seekers profile IDF (4 aides, 2 procedures, 2 services) |
| 1.0.4 | 2025-12-09 | Added families profile IDF (6 aides, 3 procedures, 2 services) |
| 1.0.5 | 2025-12-09 | Added seniors profile IDF (4 aides, 2 procedures, 2 services) |
| 1.0.6 | 2025-12-09 | Added disabled profile IDF (4 aides, 2 procedures, 2 services) |
| 1.0.7 | 2025-12-09 | Added tourists profile IDF (2 aides, 3 procedures, 2 services) |
| 1.0.8 | 2025-12-09 | Added naturalization profile IDF (2 aides, 4 procedures, 2 services) - IDF COMPLETE |
| 1.1.0 | 2025-12-09 | Added ARA region - all 8 profiles (22 aides, 15 procedures, 17 services) |
| 1.2.0 | 2025-12-09 | Added Occitanie region - all 8 profiles (20 aides, 13 procedures, 16 services) |
| 1.3.0 | 2025-12-09 | Added PACA region - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.4.0 | 2025-12-09 | Added Hauts-de-France region - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.5.0 | 2025-12-09 | Added Bourgogne-Franche-Comté region - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.6.0 | 2025-12-09 | Added Bretagne region - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.7.0 | 2025-12-09 | Added Centre-Val de Loire region - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.8.0 | 2025-12-09 | Added Corse region - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.9.0 | 2025-12-09 | Added Grand Est region - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.10.0 | 2025-12-09 | Added Normandie region - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.11.0 | 2025-12-09 | Added Nouvelle-Aquitaine region - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.12.0 | 2025-12-09 | Added Pays de la Loire region - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.13.0 | 2025-12-09 | Added Guadeloupe (DOM-TOM) - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.14.0 | 2025-12-09 | Added Martinique (DOM-TOM) - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.15.0 | 2025-12-09 | Added Guyane (DOM-TOM) - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.16.0 | 2025-12-09 | Added La Réunion (DOM-TOM) - all 8 profiles (23 aides, 17 procedures, 17 services) |
| 1.17.0 | 2025-12-09 | Added Mayotte (DOM-TOM) - all 8 profiles (23 aides, 17 procedures, 17 services) - 🎉 ALL 18 REGIONS COMPLETE! |
