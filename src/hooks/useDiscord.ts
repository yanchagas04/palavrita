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
      // Se não houver Client ID configurado ou não estiver no Discord SDK, fallback para Web
      if (!clientId) {
        if (isMounted) {
          setUser({
            id: "local_dev",
            username: "Jogador",
            globalName: "Visitante Web",
          });
          setIsReady(true);
        }
        return;
      }

      try {
        const discordSdk = new DiscordSDK(clientId);
        await discordSdk.ready();

        // Solicita autorização de identidade
        const { code } = await discordSdk.commands.authorize({
          client_id: clientId,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify"],
        });

        // Caso consiga autorizar com sucesso
        if (isMounted) {
          setInDiscord(true);
          setUser({
            id: "discord_user",
            username: "Discord Player",
            globalName: "Membro Discord",
          });
          setIsReady(true);
        }
      } catch (err) {
        console.log("Executando fora do cliente do Discord (Modo Web/Dev).", err);
        if (isMounted) {
          setUser({
            id: "web_player",
            username: "Jogador",
            globalName: "Jogador Palavrita",
          });
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
