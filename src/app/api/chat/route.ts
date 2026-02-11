export const runtime = "nodejs";

import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type ChatBody = {
  message: string;
  history?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

const openai = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.BAILIAN_API_KEY,
});

// Helper: call proxy /responses endpoint directly via fetch so we can control
// the exact URL and headers when routing through a non-standard proxy.
async function proxyResponsesCreate(payload: any, signal?: AbortSignal) {
  const baseEnv = process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const base = String(baseEnv).replace(/\/+$/, "");

  const candidates: string[] = [];
  candidates.push(`${base}/responses`);

  if (base.includes('/compatible-mode')) {
    const root = base.split('/compatible-mode')[0].replace(/\/+$/, '');
    candidates.push(`${root}/v1/responses`, `${root}/responses`);
  }

  try {
    const u = new URL(base);
    candidates.push(`${u.protocol}//${u.host}/v1/responses`);
    candidates.push(`${u.protocol}//${u.host}/responses`);
    candidates.push(`${u.protocol}//${u.host}/compatible-mode/v1/responses`);
    candidates.push(`${u.protocol}//${u.host}/compatible-mode/responses`);
  } catch {}

  let lastErr: any = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.BAILIAN_API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (res.ok) return res.json();

      const txt = await res.text().catch(() => '');
      const meta = { status: res.status, statusText: res.statusText, url, body: txt };
      console.error('proxyResponsesCreate: non-ok response', meta);

      if (res.status === 404) {
        lastErr = meta;
        continue;
      }

      const err: any = new Error(`${res.status} ${res.statusText}${txt ? `: ${txt}` : ''}`);
      err.status = res.status;
      err.headers = res.headers;
      err.url = url;
      throw err;
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      console.error('proxyResponsesCreate: request error', { url, error: String(err?.message ?? err) });
      lastErr = lastErr || { url, error: String(err?.message ?? err) };
    }
  }

  const message = lastErr
    ? `All proxy endpoints failed. Last: ${JSON.stringify(lastErr)}`
    : `No proxy endpoints attempted`;
  const finalErr: any = new Error(message);
  finalErr.details = lastErr;
  throw finalErr;
}

// Bridge helper that uses the OpenAI SDK to create chat completions.
// Keeps the rest of the file's proxy* naming but delegates to the SDK instance above.
async function proxyChatCompletionsCreate(payload: any, signal?: AbortSignal) {
  try {
    // The OpenAI SDK handles the request to the configured baseURL.
    const res = await openai.chat.completions.create(payload as any);
    return res;
  } catch (err: any) {
    // Re-throw so callers can handle timeouts / network errors as before.
    throw err;
  }
}

function isNumericId(s: string) {
  return /^\d+$/.test(s);
}

/**
 * 不限制 LCK：全库搜索
 * - q 支持 name/slug/teamName 模糊匹配
 * - 如果 q 是纯数字，额外按 leaguepediaId(Int) 精确匹配
 * - 可选 region 精确匹配（不传则不过滤）
 */
async function searchPlayers(args: {
  q?: string;
  team?: string;
  role?: string;
  isActive?: boolean;
  region?: string;
  take?: number;
}) {
  const q = (args.q ?? "").trim();
  const team = (args.team ?? "").trim();
  const role = (args.role ?? "").trim();
  const region = (args.region ?? "").trim();

  const takeRaw = typeof args.take === "number" ? args.take : 20;
  const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 50) : 20;

  const where: any = {};

  if (q) {
    const isNum = isNumericId(q);
    const qNum = isNum ? Number(q) : null;

    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { teamName: { contains: q, mode: "insensitive" } },
      ...(isNum ? [{ leaguepediaId: qNum }] : []),
    ];
  }

  if (team) where.teamName = { contains: team, mode: "insensitive" };
  if (role) where.role = role;
  if (typeof args.isActive === "boolean") where.isActive = args.isActive;

  // region 不限制：只有传了才过滤
  if (region) where.region = region;

  const items = await prisma.player.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take,
    select: {
      id: true,
      slug: true,
      leaguepediaId: true,
      region: true,
      name: true,
      country: true,
      role: true,
      teamName: true,
      overviewPage: true,
      player: true,
      image: true,
      nameAlphabet: true,
      nameFull: true,
      nativeName: true,
      nationality: true,
      nationalityPrimary: true,
      age: true,
      birthdate: true,
      deathdate: true,
      residencyFormer: true,
      team2: true,
      currentTeams: true,
      teamSystem: true,
      team2System: true,
      residency: true,
      contract: true,
      contractText: true,
      favChamps: true,
      soloqueueIds: true,
      askfm: true,
      bluesky: true,
      discord: true,
      facebook: true,
      instagram: true,
      lolpros: true,
      dpmlol: true,
      reddit: true,
      snapchat: true,
      stream: true,
      kick: true,
      twitter: true,
      threads: true,
      linkedIn: true,
      vk: true,
      website: true,
      weibo: true,
      youtube: true,
      teamLast: true,
      roleLast: true,
      isRetired: true,
      toWildrift: true,
      toValorant: true,
      toTFT: true,
      toLegendsOfRuneterra: true,
      to2XKO: true,
      isPersonality: true,
      isSubstitute: true,
      isTrainee: true,
      isLowercase: true,
      isAutoTeam: true,
      isLowContent: true,
      isActive: true,
      dataHash: true,
      createdAt: true,
      updatedAt: true,
      lastSyncedAt: true,
    },
  });

  return { items };
}

/**
 * 不限制 LCK：全库按 id 或 leaguepediaId 获取
 * - id 参数如果是纯数字：按 leaguepediaId(Int) 查（不加 region 过滤）
 * - 否则按库内主键 id 查
 */
async function getPlayer(args: { id: string }) {
  const id = String(args.id ?? "").trim();
  if (!id) return null;

  const isNum = isNumericId(id);
  const leaguepediaId = isNum ? Number(id) : null;

  const player = await prisma.player.findFirst({
    where: isNum ? { leaguepediaId } : { id },
    select: {
      id: true,
      slug: true,
      leaguepediaId: true,
      region: true,
      name: true,
      country: true,
      role: true,
      teamName: true,
      overviewPage: true,
      player: true,
      image: true,
      nameAlphabet: true,
      nameFull: true,
      nativeName: true,
      nationality: true,
      nationalityPrimary: true,
      age: true,
      birthdate: true,
      deathdate: true,
      residencyFormer: true,
      team2: true,
      currentTeams: true,
      teamSystem: true,
      team2System: true,
      residency: true,
      contract: true,
      contractText: true,
      favChamps: true,
      soloqueueIds: true,
      askfm: true,
      bluesky: true,
      discord: true,
      facebook: true,
      instagram: true,
      lolpros: true,
      dpmlol: true,
      reddit: true,
      snapchat: true,
      stream: true,
      kick: true,
      twitter: true,
      threads: true,
      linkedIn: true,
      vk: true,
      website: true,
      weibo: true,
      youtube: true,
      teamLast: true,
      roleLast: true,
      isRetired: true,
      toWildrift: true,
      toValorant: true,
      toTFT: true,
      toLegendsOfRuneterra: true,
      to2XKO: true,
      isPersonality: true,
      isSubstitute: true,
      isTrainee: true,
      isLowercase: true,
      isAutoTeam: true,
      isLowContent: true,
      isActive: true,
      dataHash: true,
      createdAt: true,
      updatedAt: true,
      lastSyncedAt: true,
    },
  });

  return player;
}

export async function POST(req: NextRequest) {
  if (!process.env.BAILIAN_API_KEY) {
    return NextResponse.json({ error: "Missing BAILIAN_API_KEY" }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as ChatBody | null;
  const message = body?.message?.trim();
  const history = Array.isArray(body?.history) ? body!.history : [];

  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const model = process.env.BAILIAN_MODEL || "gpt-4.1-mini";

  // 1) 让模型决定是否调用工具
  let first: any;
  try {
    const ac1 = new AbortController();
    const to1 = setTimeout(() => ac1.abort(), 15_000);
    try {
      // Use chat/completions compatibility endpoint on proxy with function-calling fields
      const messages: any[] = [
        { role: 'system', content: '你是一个英雄联盟选手信息助手（不限制赛区）。当用户需要选手名单或某位选手详情时，优先调用工具获取真实数据再回答。回答用中文，尽量简洁清晰。' },
        ...history,
        { role: 'user', content: message },
      ];

      const functions = [
        {
          name: 'search_players',
          description: '按条件搜索选手列表（全库，不限制赛区）。支持 q/team/role/isActive；region 可选（不传则不过滤）。',
          parameters: {
            type: 'object',
            additionalProperties: false,
            properties: {
              q: { type: 'string' },
              team: { type: 'string' },
              role: { type: 'string' },
              isActive: { type: 'boolean' },
              region: { type: 'string' },
              take: { type: 'number' },
            },
          },
        },
        {
          name: 'get_player',
          description: '获取单个选手详情（全库，不限制赛区）：参数 id 既可以是库内 id，也可以是纯数字 leaguepediaId。',
          parameters: {
            type: 'object',
            additionalProperties: false,
            properties: { id: { type: 'string' } },
            required: ['id'],
          },
        },
      ];

      first = await proxyChatCompletionsCreate(
        {
          model,
          messages,
          functions,
          function_call: 'auto',
        },
        ac1.signal,
      );
    } finally {
      clearTimeout(to1);
    }
  } catch (err: any) {
    console.log("Error during initial OpenAI call:", err);
    if (err?.name === "AbortError" || /timeout|aborted/i.test(String(err))) {
      return NextResponse.json({ error: "OpenAI request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }

  // Normalize tool-calling info from chat/completions response
  const toolCalls: Array<{ name: string; arguments: string; call_id: string }> = [];
  try {
    const choices = Array.isArray(first?.choices) ? first.choices : [];
    for (let i = 0; i < choices.length; i++) {
      const ch = choices[i];
      const fc = ch?.message?.function_call;
      if (fc && fc.name) {
        const callId = `${first.id || 'resp'}-${i}`;
        toolCalls.push({ name: fc.name, arguments: fc.arguments || '{}', call_id: callId });
      }
    }
  } catch {}

  // 2) 执行工具
  const toolOutputs: Array<{ type: "function_call_output"; call_id: string; output: string; name?: string }> = [];

  for (const call of toolCalls) {
    const name = call.name;
    const callId = call.call_id;

    let args: any = {};
    try {
      args = call.arguments ? JSON.parse(call.arguments) : {};
    } catch {
      args = {};
    }

    if (!callId || !name) continue;

    if (name === 'search_players') {
      const result = await searchPlayers(args);
      toolOutputs.push({ type: 'function_call_output', call_id: callId, output: JSON.stringify(result), name });
    } else if (name === 'get_player') {
      const result = await getPlayer(args);
      toolOutputs.push({ type: 'function_call_output', call_id: callId, output: JSON.stringify(result), name });
    } else {
      toolOutputs.push({ type: 'function_call_output', call_id: callId, output: JSON.stringify({ error: `Unknown tool: ${name}` }), name });
    }
  }

  // 3) 工具结果喂回模型生成最终答复
  let finalResp: any;
  if (toolOutputs.length > 0) {
    try {
      const ac2 = new AbortController();
      const to2 = setTimeout(() => ac2.abort(), 15_000);
      try {
        const messages: any[] = [
          { role: 'system', content: '你是一个英雄联盟选手信息助手（不限制赛区）。下面会提供工具返回的 JSON 数据，请基于真实数据回答用户问题；不要编造不存在的字段或事实。' },
          ...history,
          { role: 'user', content: message },
        ];

        for (const out of toolOutputs) {
          messages.push({ role: 'function', name: out.name || 'tool', content: out.output });
        }

        const functions = [
          {
            name: 'search_players',
            description: '按条件搜索选手列表（全库，不限制赛区）。支持 q/team/role/isActive；region 可选（不传则不过滤）。',
            parameters: { type: 'object' },
          },
          { name: 'get_player', description: '获取单个选手详情', parameters: { type: 'object' } },
        ];

        finalResp = await proxyChatCompletionsCreate({ model, messages, functions, function_call: 'none' }, ac2.signal);
      } finally {
        clearTimeout(to2);
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || /timeout|aborted/i.test(String(err))) {
        return NextResponse.json({ error: "OpenAI request timed out" }, { status: 504 });
      }
      return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
    }
  } else {
    finalResp = first;
  }

  // Extract final assistant content from chat/completions response
  let reply = "我没有拿到可用的结果。你可以换个关键词、队伍名或 leaguepediaId 再试一次。";
  try {
    const choice = Array.isArray(finalResp?.choices) ? finalResp.choices[0] : null;
    const content = choice?.message?.content ?? choice?.message?.delta?.content ?? finalResp?.output_text;
    if (content && String(content).trim()) reply = String(content).trim();
  } catch {}

  return NextResponse.json({
    reply,
    toolCalls: toolCalls.map((c: any) => ({ name: c.name, arguments: c.arguments })),
  });
}
