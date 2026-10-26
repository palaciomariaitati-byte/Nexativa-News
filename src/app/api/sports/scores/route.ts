import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 60; // 60 segundos para mantener marcadores al minuto

const LEAGUES = [
  { id: "argentina", name: "Liga Profesional 🇦🇷", flag: "🇦🇷", code: "arg.1" },
  { id: "espana", name: "LaLiga 🇪🇸", flag: "🇪🇸", code: "esp.1" },
  { id: "inglaterra", name: "Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "eng.1" },
  { id: "italia", name: "Serie A 🇮🇹", flag: "🇮🇹", code: "ita.1" },
  { id: "champions", name: "Champions League 🏆", flag: "🏆", code: "uefa.champions" },
];

export async function GET() {
  try {
    const allMatches: any[] = [];

    await Promise.all(
      LEAGUES.map(async (league) => {
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`;
          const res = await fetch(url, { headers: { 'User-Agent': 'NexativaNews/1.0' }, cache: 'no-store' });
          if (!res.ok) return;

          const data = await res.json();
          const events = data.events || [];

          events.slice(0, 4).forEach((evt: any) => {
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
              homeLogo: home.team?.logo || "",
              homeScore: parseInt(home.score || "0", 10),
              awayTeam: away.team?.shortDisplayName || away.team?.name || "Visitante",
              awayLogo: away.team?.logo || "",
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

    // Ordenar: primero EN VIVO, luego PRÓXIMO (hoy), luego FINALIZADO
    allMatches.sort((a, b) => {
      const order: Record<string, number> = { "EN VIVO": 0, "PRÓXIMO": 1, "FINALIZADO": 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

    return NextResponse.json({ success: true, matches: allMatches, timestamp: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
