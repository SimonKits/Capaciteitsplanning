# Tuesday — capaciteitsplanning

Nederlandstalige website voor medewerkers, teams en projectplanning.

De vormgeving sluit aan op https://tsavo.eu/: petrol (#004e54), turquoise (#008692), oranje (#e66239), Roboto en Zilla Slab. Het originele Tsavo-logo uit de website staat lokaal in `public/tsavo-logo.svg`. De bestaande indeling en browseropslag blijven behouden.

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

- Medewerkerslijst met zoeken en teamfilter, zonder overzichtskaarten of totaaltellers.
- Bij aanmaken alleen naam, team en uren per werkdag invullen; de som vormt de contracturen. Functie, verlofbudget en verlofperiodes zijn beschikbaar bij bewerken.
- Team, functie en uren per werkdag (maandag t/m vrijdag) vastleggen. Contracturen worden automatisch opgeteld; zaterdag en zondag zijn altijd nul. Dit geldt ook voor bestaande medewerkers.
- Verlofperiodes toevoegen, aanpassen en verwijderen bij het aanmaken of bewerken van een medewerker. Begin- en einddatum zijn inclusief. Overlappende verlofperiodes worden nooit dubbel afgetrokken.
- Zoeken en filteren op team.
- Een medewerker met projectplanning kan pas worden verwijderd nadat die planning is verwijderd.

De namen, organisatie en het profiel in de eerste versie zijn voorbeelden. Er is nog geen inlogfunctie.

## Jaarlijks verlof en conceptverlof

Bij elke medewerker vul je het verlofbudget per kalenderjaar afzonderlijk in. Kies het jaar en vul de uren in; er is geen standaardbudget en niets wordt automatisch overgenomen naar volgende jaren. Een leeg jaarbudget betekent dat er voor dat jaar geen conceptverlof wordt gepland. Echt ingepland verlof blijft wel meetellen. Expliciet opgeslagen jaarbudgetten blijven behouden; eerder ingevulde standaardbudgetten worden niet meer gebruikt. Budgetten worden niet automatisch naar rato van contractwijzigingen aangepast.

De teller toont het budget, echt gepland verlof, het resterende saldo en conceptverlof. Verlof kost de persoonlijke contracturen op de betreffende dag; weekenden en vrije dagen kosten nul. Overlappende periodes tellen eenmaal en verlof rond de jaarwisseling wordt aan de juiste jaren toegerekend. Een negatief saldo blijft zichtbaar; echt verlof wordt daardoor niet geblokkeerd.

Met de schakelaar voor conceptverlof worden ongeplande verlofuren vanaf het einde van elk jaar teruggepland op beschikbare persoonlijke werkdagen, nooit vóór vandaag of bovenop echt verlof. Ook een gedeeltelijke laatste dag is mogelijk. Conceptverlof vermindert capaciteit én project- en taaktotalen; projecturen op gedeeltelijke verlofdagen worden naar rato verminderd. De conceptdatums zijn in het medewerkerformulier uitklapbaar en worden dynamisch herberekend bij wijzigingen aan verlof, budget of werkdaguren. Conceptverlof is geen bevestigd verlof en vermindert de teller voor echt resterend verlof niet.

Schakel conceptverlof uit om uitsluitend echt ingepland verlof mee te tellen. Past het saldo niet in de beschikbare werkdagen, dan wordt het ongeplande restant vermeld. Er is geen automatische saldo-overdracht tussen jaren. De berekening gebruikt de huidige werkdaguren; historische contractroosters worden nog niet vastgelegd.

## Projecten

Het menuonderdeel **Projecten** vervangt **Rooster**.

- Een tabblad per team, gebaseerd op de medewerkers en bestaande projecten.
- Reguliere projecten met projectnaam, Exact-code en projectleider.
- Normale projecten worden in een schermvullend venster aangemaakt en bewerkt: projectgegevens links, taakgroepen rechts en vaste knoppen voor opslaan en annuleren. Onder iedere taak staat een regel per medewerker met weekuren, uren in de hele taakperiode en resterende uren vanaf vandaag, na aftrek van verlof en conceptverlof.
- Compacte projectkaarten met titel, projectleider, Exact-code, een korte medewerkerslijst en resterende geplande uren. De volledige planning is uitklapbaar.
- Medewerkers per taak toevoegen met een dropdown en plusknop, of alle huidige leden van een team in één keer toevoegen. Dubbele medewerkers worden voorkomen; toegevoegde medewerkers zijn apart te verwijderen.
- Tijdens aanmaken en bewerken toont elke taak het totaal over de hele taakperiode en de resterende uren vanaf vandaag, beide na aftrek van verlof. Deze taaktotalen staan alleen in het formulier.
- Meerdere taken per project. Selecteer per taak meerdere medewerkers met één gezamenlijke periode en hetzelfde aantal uren per persoon per week. Bij 4 uur en 3 medewerkers wordt dus 12 uur per week gepland.
- Resterende uren tellen vanaf vandaag (inclusief) tot het einde van elke taak, alleen maandag t/m vrijdag en zonder het verlof van de betreffende medewerker. Overlappend verlof wordt eenmaal afgetrokken. Verlopen inzet telt niet mee.
- Bestaande planning blijft bewaard en wordt bij bewerken als taken weergegeven; inzet met dezelfde periode en weekuren wordt gegroepeerd.
- Meerdere opeenvolgende periodes voor dezelfde medewerker, bijvoorbeeld eerst 8 en daarna 16 uur per week.
- Begin- en einddatum tellen mee. Overlappende periodes voor dezelfde medewerker binnen dezelfde taak zijn niet toegestaan; verschillende taken mogen gelijktijdig lopen en hun uren tellen op. Aansluitende periodes beginnen op de dag na de vorige einddatum.
- Uren in stappen van een kwartier. Projecten kunnen alvast zonder medewerkers worden opgeslagen.
- Exact-codes zijn uniek binnen een team. Er is geen koppeling met de Exact-software.
- Projecten en hun planning bewerken of verwijderen.
- Verduurzamingsprojecten hebben een eigen tabblad met fases en rolplanning (zie hieronder).

## Verduurzamingsprojecten

- Projectnaam, Exact-code, team en een projectleider uit de medewerkerslijst.
- Vier vaste fases: EAR, PP, RP en DE. Elke fase duurt 1–520 hele weken; een week bestaat uit zeven kalenderdagen. Alleen maandag t/m vrijdag telt mee in de projecturen.
- EAR heeft een eigen startdatum. Iedere volgende fase kan aan de voorgaande gekoppeld worden en begint dan de dag na diens einddatum. Wijzigingen in start of duur werken direct door in de gekoppelde vervolgfasen. Een losgekoppelde fase houdt haar startdatum; volgende fases kunnen daar weer aan gekoppeld blijven.
- Projectbrede medewerkers met de rollen Projectleider, Projectleider Participatie, Planontwikkelaar en Programmamanager. Per fase stel je voor iedere rol de uren per medewerker per week in. Nul uur betekent geen inzet.
- Extra medewerkers kunnen voor één specifieke fase worden toegevoegd. Per medewerker kun je een fase uitschakelen, afwijkende uren kiezen of een eigen begin- en einddatum instellen, ook buiten de fasedatums. Eigen datums blijven vast bij verschuiving; uitschakelen van de eigen tijdlijn herstelt de koppeling aan de fase.
- Meerdere rollen of overlappende fases voor dezelfde medewerker tellen op in de capaciteit. Dezelfde medewerker/rol kan maar één keer binnen dezelfde fase staan.
- Bij het kiezen van de projectleider wordt die medewerker als projectbrede Projectleider toegevoegd. Bij een latere wisseling blijft de eerdere inzet staan totdat je die zelf verwijdert.
- De fase-uren en projecttotalen houden rekening met verlof en ingeschakeld conceptverlof. De capaciteit toont fase en rol bij de inzetdetails.
- Medewerkers die als projectleider, projectbrede medewerker of extra fasemedewerker gekoppeld zijn, kunnen niet worden verwijderd, ook als hun uren nog nul zijn.

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
