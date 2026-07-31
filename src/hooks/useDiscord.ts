"use client";

import { useEffect, useState } from "react";
import { DiscordSDK } from "@discord/embedded-app-sdk";

export interface DiscordUser {
  id: string;
  username: string;
  globalName?: string;
  avatarUrl?: string;
}

export function useDiscord() {
  const [isReady, setIsReady] = useState(false);
  const [inDiscord, setInDiscord] = useState(false);
  const [user, setUser] = useState<DiscordUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

    async function initDiscord() {
      if (!clientId) {
        if (isMounted) {
          setUser({ id: "dev", username: "Jogador", globalName: "Visitante Web" });
          setIsReady(true);
        }
        return;
      }

      try {
        const discordSdk = new DiscordSDK(clientId);
        await discordSdk.ready();

        if (isMounted) {
          setInDiscord(true);
          setUser({ id: "discord", username: "Discord Player", globalName: "Membro Discord" });
          setIsReady(true);
        }

        // Tenta autorizar em segundo plano sem travar o carregamento
        try {
          await discordSdk.commands.authorize({
            client_id: clientId,
            response_type: "code",
            state: "",
            prompt: "none",
            scope: ["identify"],
          });
        } catch (e) {
          console.log("Autorização de escopo opcional pulada:", e);
        }
      } catch (err) {
        console.log("Executando fora do cliente do Discord ou em modo de compatibilidade:", err);
        if (isMounted) {
          setUser({ id: "web", username: "Jogador", globalName: "Visitante Web" });
          setIsReady(true);
        }
      }
    }

    initDiscord();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isReady, inDiscord, user };
}
