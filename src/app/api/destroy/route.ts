import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-caption-extractor';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractVideoId } from '@/lib/youtube';

export async function POST(req: NextRequest) {
    try {
        const { url, apiKey: userApiKey, language = 'English' } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const apiKey = userApiKey || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key is required. Please add it in settings or set GEMINI_API_KEY on the server.' }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        let transcriptText = '';
        try {
            console.log('--- FETCHING TRANSCRIPT ---');
            console.log('Video ID:', videoId);

            // Attempt 1: youtube-caption-extractor (English)
            try {
                console.log('Attempting youtube-caption-extractor (en)...');
                const subtitles = await getSubtitles({ videoID: videoId, lang: 'en' });
                if (subtitles && subtitles.length > 0) {
                    transcriptText = subtitles.map((t: any) => t.text).join(' ');
                    console.log('Success with youtube-caption-extractor (en)');
                }
            } catch (e) {
                console.log('youtube-caption-extractor (en) failed');
            }

            // Attempt 2: youtube-caption-extractor (Turkish) fallback
            if (!transcriptText) {
                try {
                    console.log('Attempting youtube-caption-extractor (tr)...');
                    const subtitles = await getSubtitles({ videoID: videoId, lang: 'tr' });
                    if (subtitles && subtitles.length > 0) {
                        transcriptText = subtitles.map((t: any) => t.text).join(' ');
                        console.log('Success with youtube-caption-extractor (tr)');
                    }
                } catch (e) {
                    console.log('youtube-caption-extractor (tr) failed');
                }
            }

            // Attempt 3: youtube-transcript (More robust in some cloud environments)
            if (!transcriptText) {
                try {
                    console.log('Attempting youtube-transcript fallback...');
                    const { YoutubeTranscript } = await import('youtube-transcript');
                    const subtitles = await YoutubeTranscript.fetchTranscript(videoId);
                    if (subtitles && subtitles.length > 0) {
                        transcriptText = subtitles.map((t: any) => t.text).join(' ');
                        console.log('Success with youtube-transcript');
                    }
                } catch (e) {
                    console.log('youtube-transcript failed:', e instanceof Error ? e.message : e);
                }
            }

            // Attempt 4: Manual Scraping (Directly from page source)
            if (!transcriptText) {
                try {
                    console.log('Attempting Manual Scraping (Last Resort)...');
                    const videoPageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                            'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
                        }
                    });
                    const html = await videoPageRes.text();

                    // Look for ytInitialPlayerResponse
                    const playerRegex = /var ytInitialPlayerResponse\s*=\s*({.+?});/;
                    const playerMatch = html.match(playerRegex);

                    if (playerMatch && playerMatch[1]) {
                        const playerResponse = JSON.parse(playerMatch[1]);
                        const captionTracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;

                        if (captionTracks && captionTracks.length > 0) {
                            // Order: Preferred Lang -> First available
                            const track = captionTracks.find((t: any) => t.languageCode === 'en') ||
                                captionTracks.find((t: any) => t.languageCode === 'tr') ||
                                captionTracks[0];

                            console.log('Manual scraping found track:', track.languageCode);
                            const transcriptRes = await fetch(track.baseUrl);
                            const transcriptXml = await transcriptRes.text();

                            // Simple XML parsing/stripping
                            const textSegments = transcriptXml.match(/<text[^>]*>([\s\S]*?)<\/text>/g);
                            if (textSegments) {
                                transcriptText = textSegments
                                    .map(seg => seg.replace(/<text[^>]*>([\s\S]*?)<\/text>/, '$1'))
                                    .map(txt => txt.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
                                    .join(' ');
                                console.log('Success with Manual Scraping');
                            }
                        }
                    } else {
                        console.log('No ytInitialPlayerResponse found in manual fetch');
                    }
                } catch (e) {
                    console.log('Manual scraping failed:', e instanceof Error ? e.message : e);
                }
            }

            // Attempt 5: Mobile Site (Often less protected)
            if (!transcriptText) {
                try {
                    console.log('Attempting Mobile Scraping...');
                    const mobileRes = await fetch(`https://m.youtube.com/watch?v=${videoId}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                        }
                    });
                    const mobileHtml = await mobileRes.text();
                    const mobilePlayerRegex = /"captions":\s*({.*?}),\s*"videoDetails"/;
                    const mobilePlayerMatch = mobileHtml.match(mobilePlayerRegex);
                    if (mobilePlayerMatch && mobilePlayerMatch[1]) {
                        const playerResponse = JSON.parse(mobilePlayerMatch[1]);
                        const captionTracks = playerResponse.playerCaptionsTracklistRenderer?.captionTracks;
                        if (captionTracks && captionTracks.length > 0) {
                            const track = captionTracks.find((t: any) => t.languageCode === 'en') || captionTracks[0];
                            const transcriptRes = await fetch(track.baseUrl);
                            const transcriptXml = await transcriptRes.text();
                            const segments = transcriptXml.match(/<text[^>]*>([\s\S]*?)<\/text>/g);
                            if (segments) {
                                transcriptText = segments.map(s => s.replace(/<text[^>]*>([\s\S]*?)<\/text>/, '$1').replace(/&amp;/g, '&').replace(/&#39;/g, "'")).join(' ');
                                console.log('Success with Mobile Scraping');
                            }
                        }
                    }
                } catch (e) {
                    console.log('Mobile Scraping failed');
                }
            }

            // --- FINAL EMERGENCY FALLBACK: TITLE & DESCRIPTION ONLY ---
            if (!transcriptText || transcriptText.trim().length < 50) {
                console.log('--- ALL TRANSCRIPT ATTEMPTS FAILED. RESORTING TO METADATA ---');
                try {
                    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                        }
                    });
                    const html = await pageRes.text();

                    // Robust Extraction: meta tags are reliable for title/desc
                    const titleMeta = html.match(/<meta\s+name="title"\s+content="(.*?)">/) ||
                        html.match(/<meta\s+property="og:title"\s+content="(.*?)">/);
                    const descMeta = html.match(/<meta\s+name="description"\s+content="(.*?)">/) ||
                        html.match(/<meta\s+property="og:description"\s+content="(.*?)">/);

                    let title = titleMeta ? titleMeta[1] : '';
                    let description = descMeta ? descMeta[1] : '';

                    if (!title) {
                        const titleMatch = html.match(/<title>(.*?)<\/title>/);
                        title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'Unknown Title';
                    }
                    if (!description) {
                        const descMatch = html.match(/"shortDescription":"(.*?)"/);
                        description = descMatch ? descMatch[1].substring(0, 1000) : 'No description available';
                    }

                    transcriptText = `VIDEO TITLE: ${title}\n\nVIDEO DESCRIPTION: ${description}\n\n[SYSTEM NOTE: Full transcript was blocked by YouTube. USE THE TITLE AND DESCRIPTION TO DESTROY THE CLICKBAIT.]`;
                    console.log('Using Robust Metadata Fallback');
                } catch (e) {
                    console.error('Metadata fallback failed:', e);
                }
            }

            if (!transcriptText || transcriptText.trim().length < 10) {
                return NextResponse.json({
                    error: 'YouTube is completely blocking the server. Please try a different video or try again later.'
                }, { status: 400 });
            }

            console.log('Final Data Length:', transcriptText.length);
        } catch (e) {
            console.error('Unexpected fatal error in transcript logic:', e);
            return NextResponse.json({ error: 'Fatal error fetching video data.' }, { status: 500 });
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
You are a "De-Clickbaiter". Your mission is to reveal the actual answer/secret behind a YouTube video's clickbait title.

RULES:
1. Reveal the truth IMMEDIATELY. 
2. Be brief (1-2 sentences).
3. Be sarcastic and edgy.
4. Respond ONLY in ${language}.

${transcriptText.includes('[SYSTEM NOTE:') ? `
NOTE: Only metadata (title/description) is available. Analyze it to reveal the "bait".
` : ''}

DATA TO ANALYZE:
${transcriptText.substring(0, 30000)}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const truth = response.text();

        return NextResponse.json({
            truth,
            videoId,
            // Rough estimation: sum of durations / 60
            // But we can just use a placeholder or better logic if we had duration.
            // For now, let's assume we saved them "some" time based on character count (rough proxy for length)
            timeSaved: Math.ceil(transcriptText.split(' ').length / 150) // Assuming 150 words per minute
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('Destroy Error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
