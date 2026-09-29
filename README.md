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
- Team, functie en uren per werkdag (maandag t/m vrijdag) vastleggen. Contracturen worden automatisch opgeteld; zaterdag en zondag zijn altijd nul. Dit geldt ook voor bestaande medewerkers.
- Verlofperiodes toevoegen, aanpassen en verwijderen bij het aanmaken of bewerken van een medewerker. Begin- en einddatum zijn inclusief. Overlappende verlofperiodes worden nooit dubbel afgetrokken.
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

Projecturen worden verdeeld over vijf werkdagen (maandag t/m vrijdag). Alleen dagen binnen de inzetperiode en de weergegeven week of maand tellen mee. Op verlofdagen worden geen projecturen gemaakt. De planning blijft bewaard; buiten de verlofperiode telt deze weer mee. Weekenden tellen niet mee; feestdagen worden niet apart verwerkt.

Contracturen zijn de som van de ingevulde uren van maandag t/m vrijdag. De beschikbare uren in een week of maand zijn de persoonlijke daguren op alle datums in die periode, zonder de verlofdagen. Een volledige week verlof geeft dus 0 beschikbare uren en 0 gemaakte projecturen. Bij gedeeltelijk verlof blijven alleen de overige dagen meetellen. Een medewerker met 8 uur op maandag t/m donderdag heeft 32 contracturen; met maandag verlof blijven er 24 uur over. Een project van 4 uur per week gebruikt die week 3,2 uur (vier dagen maal 0,8 uur).

**Overzicht** volgt later. De projectgegevens bevatten stabiele medewerker- en project-ID's en periodes. De berekening staat apart in `src/capacityModel.js`.

## Opslag

Alles wordt uitsluitend opgeslagen in deze browser op dit websiteadres. Medewerkers blijven onder `ruimte-medewerkers` staan; projecten staan apart onder `ruimte-projecten-v1`, met schemaversie 1. Bij onleesbare projectopslag wordt overschrijven geblokkeerd. Voor gedeeld gebruik door collega's zijn een database en toegangsbeheer nodig.

## Controles

```sh
npm test
npm run build
```

De tests controleren datums, overlappende inzet, validatie, opslag en capaciteitsberekeningen over volledige en gedeeltelijke weken en maanden.
