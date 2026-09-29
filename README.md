# Capaciteitsplanner

Nederlandstalige website voor medewerkers, teams en projectplanning.

## Lokaal starten

Gebruik Node.js 22 of nieuwer. Installeer de vastgelegde afhankelijkheden en start de website:

```sh
npm ci
npm run dev
```

Open het adres dat Vite toont (meestal http://127.0.0.1:5173).

Een gebouwde versie bekijken:

```sh
npm run build
npm run preview -- --port 5173
```

## Medewerkers

- Medewerkers toevoegen, bewerken en verwijderen.
- Team, functie, contracturen en uren per werkdag vastleggen.
- Zoeken en filteren op team.
- Een medewerker met projectplanning kan pas worden verwijderd nadat die planning is verwijderd.

De namen, organisatie en het profiel in de eerste versie zijn voorbeelden. Er is nog geen inlogfunctie.

## Projecten

Het menuonderdeel **Projecten** vervangt **Rooster**.

- Een tabblad per team, gebaseerd op de medewerkers en bestaande projecten.
- Reguliere projecten met projectnaam, Exact-code en projectleider.
- Meerdere medewerkers per project, ieder met een begin- en einddatum en uren per week.
- Meerdere opeenvolgende periodes voor dezelfde medewerker, bijvoorbeeld eerst 8 en daarna 16 uur per week.
- Begin- en einddatum tellen mee. Overlappende periodes voor dezelfde medewerker binnen hetzelfde project zijn niet toegestaan; aansluitende periodes beginnen op de dag na de vorige einddatum.
- Uren in stappen van een kwartier. Projecten kunnen alvast zonder medewerkers worden opgeslagen.
- Exact-codes zijn uniek binnen een team. Er is geen koppeling met de Exact-software.
- Projecten en hun planning bewerken of verwijderen.
- Verduurzamingsprojecten hebben een eigen plaats; de invoer en planning hiervan volgen later.

**Capaciteit** en **Overzicht** volgen later. De projectgegevens bevatten stabiele medewerker- en project-ID's en periodes voor de latere capaciteitsweergave. `getAllocationsForDate` in `src/projectModel.js` geeft de inzet terug die actief is op een gekozen datum. Deze versie controleert nog niet de totale bezetting van een medewerker over verschillende projecten.

## Opslag

Alles wordt uitsluitend opgeslagen in deze browser op dit websiteadres. Medewerkers blijven onder `ruimte-medewerkers` staan; projecten staan apart onder `ruimte-projecten-v1`, met schemaversie 1. Bij onleesbare projectopslag wordt overschrijven geblokkeerd. Voor gedeeld gebruik door collega's zijn een database en toegangsbeheer nodig.

## Controles

```sh
npm test
npm run build
```

De tests controleren de datums, overlappende inzet, validatie, opslag en selectie van uren voor een capaciteitsdatum.
