import { NextResponse } from "next/server";

export const revalidate = 300; // Cache 5 minutes

const LEAGUES = [
  { id: "argentina", name: "Liga Profesional AR", flag: "AR", code: "arg.1" },
  { id: "espana", name: "LaLiga ES", flag: "ES", code: "esp.1" },
  { id: "inglaterra", name: "Premier League UK", flag: "UK", code: "eng.1" },
  { id: "italia", name: "Serie A IT", flag: "IT", code: "ita.1" },
  { id: "champions", name: "Champions League EU", flag: "EU", code: "uefa.champions" },
];

export async function GET() {
  try {
    const allMatches: any[] = [];

    await Promise.all(
      LEAGUES.map(async (league) => {
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`;
          const res = await fetch(url, { next: { revalidate: 300 } });
          if (!res.ok) return;

          const data = await res.json();
          const events = data.events || [];

          events.slice(0, 3).forEach((evt: any) => {
            const comp = evt.competitions?.[0];
            if (!comp) return;

            const home = comp.competitors?.find((c: any) => c.homeAway === "home");
            const away = comp.competitors?.find((c: any) => c.homeAway === "away");
            if (!home || !away) return;

            const statusState = evt.status?.type?.state;
            let status: "FINALIZADO" | "EN VIVO" | "PRÓXIMO" = "PRÓXIMO";
            if (statusState === "post") status = "FINALIZADO";
            if (statusState === "in") status = "EN VIVO";

            const dateObj = new Date(evt.date);
            const formattedTime = dateObj.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

            allMatches.push({
              id: evt.id || `m-${Math.random()}`,
              league: league.id,
              leagueName: league.name,
              flag: league.flag,
              homeTeam: home.team?.shortDisplayName || home.team?.name || "Local",
              homeLogo: home.team?.logo || "soccer",
              homeScore: parseInt(home.score || "0", 10),
              awayTeam: away.team?.shortDisplayName || away.team?.name || "Visitante",
              awayLogo: away.team?.logo || "soccer",
              awayScore: parseInt(away.score || "0", 10),
              status,
              minute: evt.status?.displayClock ? `${evt.status.displayClock}'` : undefined,
              time: formattedTime,
              date: status === "EN VIVO" ? "En Directo" : status === "FINALIZADO" ? "Finalizado" : `Hoy ${formattedTime}`,
            });
          });
        } catch (e) {
          console.error(`Error cargando liga ${league.id}:`, e);
        }
      })
    );

    return NextResponse.json({ success: true, matches: allMatches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
