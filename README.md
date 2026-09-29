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

## Capaciteit

- Een week- of maandmatrix met een bezettingsbolletje per medewerker en periode.
- Geplande uren / contracturen, bijvoorbeeld **4 / 36 u** in een volledige week.
- Filter op het team van de medewerker; inzet op projecten van andere teams telt ook mee.
- Klik op een bolletje voor de bijbehorende projecten en hun berekende uren.
- Blader vooruit of achteruit, kies een datum of keer terug naar vandaag.
- Overbezetting wordt rood weergegeven en blijft zichtbaar boven 100%.

De berekening gebruikt maandag t/m vrijdag. Uren per week worden door vijf gedeeld en vermenigvuldigd met het aantal werkdagen dat binnen zowel de inzetperiode als de weergegeven week of maand ligt. Begin- en einddatum tellen mee. Buiten de periode telt een project geen uren. Weekenden tellen niet mee; feestdagen en verlof worden nog niet apart verwerkt. De opgegeven persoonlijke werkdagen hebben in deze berekening geen invloed.

Contracturen worden op dezelfde manier naar de periode omgerekend. Een medewerker met 36 contracturen per week heeft bij 22 werkdagen in een maand **158,4 contracturen**. Een project met 4 uur per week over die hele maand gebruikt **17,6 uur**. Voor drie werkdagen binnen een week gebruikt dat project **2,4 uur**. Bedragen worden pas bij het tonen afgerond.

**Overzicht** volgt later. De projectgegevens bevatten stabiele medewerker- en project-ID's en periodes. De berekening staat apart in `src/capacityModel.js`.

## Opslag

Alles wordt uitsluitend opgeslagen in deze browser op dit websiteadres. Medewerkers blijven onder `ruimte-medewerkers` staan; projecten staan apart onder `ruimte-projecten-v1`, met schemaversie 1. Bij onleesbare projectopslag wordt overschrijven geblokkeerd. Voor gedeeld gebruik door collega's zijn een database en toegangsbeheer nodig.

## Controles

```sh
npm test
npm run build
```

De tests controleren datums, overlappende inzet, validatie, opslag en capaciteitsberekeningen over volledige en gedeeltelijke weken en maanden.
