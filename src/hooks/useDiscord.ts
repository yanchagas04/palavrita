"use client";

import { useEffect, useState } from "react";
import { DiscordSDK, DiscordSDKMock, RPCCloseCodes } from "@discord/embedded-app-sdk";

export interface DiscordUser {
  id: string;
  username: string;
  globalName?: string;
  avatarUrl?: string;
}

function getOrCreateWebUser(): DiscordUser {
  if (typeof window === "undefined") {
    return { id: "web_guest", username: "Jogador", globalName: "Visitante Web" };
  }
  try {
    const key = "palavrita_user_profile";
    const existing = localStorage.getItem(key);
    if (existing) return JSON.parse(existing);

    const randomId = "web_" + Math.random().toString(36).substring(2, 8);
    const newUser: DiscordUser = {
      id: randomId,
      username: "Jogador Web",
      globalName: "Visitante Web",
    };
    localStorage.setItem(key, JSON.stringify(newUser));
    return newUser;
  } catch (e) {
    return { id: "web_guest", username: "Jogador", globalName: "Visitante Web" };
  }
}

export function useDiscord() {
  const [isReady, setIsReady] = useState(false);
  const [inDiscord, setInDiscord] = useState(false);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [guildId, setGuildId] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

    async function initDiscord() {
      const fallbackUser = getOrCreateWebUser();

      // Sem Client ID = modo web/local
      if (!clientId) {
        if (isMounted) {
          setUser(fallbackUser);
          setGuildId("global");
          setIsReady(true);
        }
        return;
      }

      try {
        const discordSdk = new DiscordSDK(clientId);
        await discordSdk.ready();

        if (!isMounted) return;

        setInDiscord(true);
        setGuildId(discordSdk.guildId || "global");
        setChannelId(discordSdk.channelId || null);

        // Autoriza e obtém access_token
        const { code } = await discordSdk.commands.authorize({
          client_id: clientId,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify"],
        });

        // Troca code por token e perfil via nosso backend
        const authRes = await fetch("/api/auth/discord", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (authRes.ok) {
          const data = await authRes.json();
          if (data.user && isMounted) {
            setUser(data.user);
            setIsReady(true);
            return;
          }
        }

        // Fallback caso o auth falhe (sem client secret configurado)
        if (isMounted) {
          setUser({ id: "discord_user", username: "Jogador Discord", globalName: "Jogador Discord" });
          setIsReady(true);
        }
      } catch (err) {
        console.log("Executando fora do cliente Discord ou erro de autorização:", err);
        if (isMounted) {
          setUser(fallbackUser);
          setGuildId("global");
          setIsReady(true);
        }
      }
    }

    initDiscord();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isReady, inDiscord, user, guildId, channelId };
}
