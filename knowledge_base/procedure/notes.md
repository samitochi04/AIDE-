# AIDE+ Procedure Knowledge Base - Documentation

## Overview
This database contains comprehensive procedural guides for foreign students and workers arriving in France. It covers everything from pre-arrival preparations to daily life integration, excluding government financial aides (covered in main data.json).

---

## Target Profiles

### 1. Students
| Category | Description |
|----------|-------------|
| Erasmus | EU exchange students on Erasmus+ program |
| EU Students | European Union citizens studying in France |
| Non-EU Students | International students requiring visa |

### 2. Workers (Coming Soon)
| Category | Description |
|----------|-------------|
| EU Workers | European Union citizens working in France |
| Non-EU Workers | International workers requiring visa |
| Posted Workers | Employees sent by foreign companies |

---

## Data Structure Schema

```json
{
  "metadata": {
    "version": "string",
    "lastUpdated": "date",
    "description": "string"
  },
  "students": {
    "erasmus": { ... },
    "eu": { ... },
    "nonEu": { ... }
  },
  "workers": {
    "eu": { ... },
    "nonEu": { ... }
  }
}
```

### Profile Structure
```json
{
  "profileType": {
    "preArrival": {
      "visa": [...],
      "documents": [...],
      "preparation": [...]
    },
    "arrival": {
      "administrative": [...],
      "housing": [...],
      "health": [...]
    },
    "banking": {
      "banks": [...],
      "tips": [...]
    },
    "dailyLife": {
      "food": [...],
      "transport": [...],
      "communication": [...]
    },
    "discountsAndApps": {
      "studentCards": [...],
      "apps": [...],
      "discountPlatforms": [...]
    },
    "socialIntegration": {
      "meetingPlatforms": [...],
      "associations": [...],
      "events": [...]
    }
  }
}
```

---

## Categories Covered

### 🛫 Pre-Arrival
| Section | Content |
|---------|---------|
| Visa | VLS-TS, student visa procedures, Campus France |
| Documents | Required paperwork, translations, legalization |
| Preparation | Checklist, accommodation search, insurance |

### 🏛️ Administrative (Upon Arrival)
| Section | Content |
|---------|---------|
| OFII | Immigration office validation |
| University Enrollment | Final registration steps |
| Préfecture | Residence permit procedures |
| Health Insurance | CPAM/Sécurité Sociale enrollment |

### 🏦 Banking & Finance
| Section | Content |
|---------|---------|
| Traditional Banks | BNP, Société Générale, Crédit Agricole |
| Neo Banks | N26, Revolut, Boursorama |
| Student-Friendly | Best options with low/no fees |
| Tips | Required documents, best practices |

### 🏠 Housing
| Section | Content |
|---------|---------|
| CROUS | University residences |
| Private Housing | Agencies, platforms |
| Guarantors | Visale, GarantMe |
| Colocation | Flatsharing options |

### 🍽️ Daily Life - Food
| Section | Content |
|---------|---------|
| Student Restaurants | CROUS RU at €3.30 |
| Food Banks | Restos du Cœur, Secours Populaire |
| Grocery Apps | Too Good To Go, Phenix |
| Budget Tips | Markets, discount stores |

### 📱 Student Apps & Discounts
| Section | Content |
|---------|---------|
| Discount Platforms | UNiDAYS, StudentBeans, ISIC |
| Food Apps | Jow, TooGoodToGo |
| Transport | SNCF student cards |
| Shopping | Amazon Prime Student |

### 🤝 Social Integration
| Section | Content |
|---------|---------|
| Meeting Apps | Meetup, Bumble BFF, Internations |
| Student Associations | ESN, local BDE |
| Language Exchange | Tandem, HelloTalk |
| Events | Orientation weeks, cultural events |

---

## Progress Tracker

### Current Status: ALL PROFILES COMPLETE! ✅🎉

#### ✅ STUDENTS COMPLETE
| Profile | Pre-Arrival | Arrival | Banking | Daily Life | Apps | Social |
|---------|-------------|---------|---------|------------|------|--------|
| Erasmus | ✅ 6 docs, 5 prep | ✅ 4 admin, 6 housing, 3 health | ✅ 12 banks | ✅ Food, Transport, Comms | ✅ 27+ apps/platforms | ✅ 16+ resources |
| EU Students | ✅ 7 docs, 4 apps, 3 prep | ✅ 4 admin, housing, health | ↗️ (ref Erasmus) | ↗️ (ref Erasmus) | ↗️ (ref Erasmus) | ↗️ (ref Erasmus) |
| Non-EU Students | ✅ 10 docs, visa proc | ✅ 5 admin, housing, health | ✅ Non-EU specific | ↗️ (ref Erasmus) | ↗️ (ref Erasmus) | ↗️ (ref Erasmus) |

#### ✅ WORKERS COMPLETE
| Profile | Pre-Arrival | Arrival | Employment | Housing | Benefits |
|---------|-------------|---------|------------|---------|----------|
| EU Workers | ✅ 6 docs, 4 prep | ✅ 5 admin, housing, health | ✅ Full rights, CPF | ✅ + Visale | ✅ Social security, CE |
| Non-EU Workers | ✅ 6 docs, 4 visa types | ✅ 4 admin, housing, health | ✅ By visa type | ✅ + Visale | ✅ Same as French |

#### 🎉 ALL DONE!
- ✅ Erasmus Students
- ✅ EU Students  
- ✅ Non-EU Students
- ✅ EU Workers
- ✅ Non-EU Workers

---

## Key Resources

### Official Websites
| Resource | URL | Purpose |
|----------|-----|---------|
| Campus France | campusfrance.org | Pre-arrival, visa |
| France-Visas | france-visas.gouv.fr | Visa applications |
| OFII | ofii.fr | Immigration validation |
| Ameli | ameli.fr | Health insurance |
| Service-Public | service-public.fr | Official procedures |
| Étudiant.gouv.fr | etudiant.gouv.fr | Student resources |
| CAF | caf.fr | Housing benefits |

### Useful Platforms
| Platform | Purpose |
|----------|---------|
| UNiDAYS | Student discounts |
| StudentBeans | Student discounts |
| Meetup | Social events |
| TooGoodToGo | Anti-waste food |
| Jow | Meal planning |

---

## Data Entry Guidelines

1. **Include official URLs** - Every procedure must link to official source
2. **Specify requirements** - Documents, conditions, deadlines
3. **Add costs** - Free or paid, amount if applicable
4. **Timeline** - Processing times, validity periods
5. **Language availability** - Note if available in English
6. **Regional variations** - Highlight if procedure differs by region

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-09 | Initial structure created |
| 1.1.0 | 2025-12-09 | Erasmus: Pre-arrival (6 docs, 5 prep) + Arrival (4 admin, 6 housing, 3 health) |
| 1.2.0 | 2025-12-09 | Erasmus: Banking (12 banks/services) + Daily Life (food, transport, comms) |
| 1.3.0 | 2025-12-09 | Erasmus: Apps & Discounts (27+ resources) + Social Integration (16+ resources) |
| 1.4.0 | 2025-12-09 | EU Students: Complete profile (7 docs, 4 app processes, 4 admin procedures) |
| 1.5.0 | 2025-12-09 | Non-EU Students: Complete profile (visa, OFII, work rights, renewals, post-grad) |
| 1.6.0 | 2025-12-09 | EU Workers: Complete profile (6 docs, 4 prep, 5 admin, employment rights, benefits) |
| 1.7.0 | 2025-12-09 | Non-EU Workers: Complete profile (4 visa types, OFII, renewals, family reunification) - ALL COMPLETE! 🎉 |
