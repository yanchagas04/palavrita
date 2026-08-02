import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_DISCORD_CLIENT_ID não configurado" },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Código de autorização não fornecido" },
        { status: 400 }
      );
    }

    // Se a secret do cliente não estiver presente (ex: rodando sem backend secret configurado)
    if (!clientSecret) {
      console.warn("DISCORD_CLIENT_SECRET ausente. Retornando dados genéricos do cliente Discord.");
      return NextResponse.json({
        user: {
          id: "discord_user",
          username: "Jogador Discord",
          globalName: "Membro Discord",
          avatarUrl: undefined,
        },
      });
    }

    // 1. Troca de code por access_token
    const bodyParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: code,
    });

    const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Erro na troca de token com Discord:", errorText);
      return NextResponse.json(
        { error: "Falha na autenticação com o Discord" },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Busca informações do perfil do usuário (@me)
    const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("Erro ao buscar dados do usuário Discord:", errorText);
      return NextResponse.json(
        { error: "Falha ao obter dados do usuário do Discord" },
        { status: userResponse.status }
      );
    }

    const userData = await userResponse.json();

    let avatarUrl: string | undefined;
    if (userData.avatar) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
    } else {
      const defaultAvatarIndex = Number(BigInt(userData.id) % BigInt(5));
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        username: userData.username,
        globalName: userData.global_name || userData.username,
        avatarUrl,
      },
    });
  } catch (error) {
    console.error("Erro inesperado na rota /api/auth/discord:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar login do Discord" },
      { status: 500 }
    );
  }
}
