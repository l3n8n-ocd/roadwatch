import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/models.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// Demo video (#48). Figma (Mobile page 90:4): Settings/Demo video/Per role, Reporter view 493:4668,
/// Traffic Officer view 493:4718; clip coming soon 493:48058 (Web page).
///
/// One 30-second clip per role from GET /app-info, streamed with video_player (never bundled).
/// Everyone gets the Reporter clip; officers get the Traffic Officer clip first. A clip without a URL
/// shows "Clip coming soon". The videos never auto-play (reduced motion rule).
class DemoVideoScreen extends StatefulWidget {
  const DemoVideoScreen({super.key});

  @override
  State<DemoVideoScreen> createState() => _DemoVideoScreenState();
}

class _Clip {
  const _Clip(this.role, this.title, this.description);
  final String role;
  final String title;
  final String description;
}

const _reporter = _Clip(
  'Reporter',
  'Report an accident',
  'Tap Report an Accident, fill in the details, pin the place on the map, add photos and send. '
      'Track it in My reports.',
);
const _officer = _Clip(
  'Traffic Officer',
  'Work a case from your queue',
  'Open an assigned report, set it to In Progress, add remarks, then mark it Resolved/Closed.',
);

class _DemoVideoScreenState extends State<DemoVideoScreen> {
  bool _loading = true;
  ApiException? _error;
  AppInfo? _info;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final info = await context.read<RoadWatchApi>().appInfo();
      if (!mounted) return;
      setState(() {
        _info = info;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final officer = context.watch<AuthProvider>().user?.isOfficer ?? false;
    Widget body;
    if (_loading) {
      body = RwSkeletonGroup(
        label: 'Loading the demo video',
        child: Padding(
          padding: const EdgeInsets.all(RwSpace.s16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const RwSkeleton(width: 280),
              const SizedBox(height: RwSpace.s16),
              AspectRatio(
                aspectRatio: 16 / 9,
                child: RwSkeleton(height: double.infinity, radius: RwRadius.md),
              ),
            ],
          ),
        ),
      );
    } else if (_error != null) {
      body = ListView(
        children: [
          RwEmptyState.error(
            title: "Couldn't load the demo video",
            message: _error!.kind == ApiErrorKind.network
                ? 'Check your connection, then try again.'
                : _error!.message,
            onAction: _load,
          ),
        ],
      );
    } else {
      final info = _info!;
      final cards = officer
          ? [(_officer, info.officerClip, true), (_reporter, info.reporterClip, false)]
          : [(_reporter, info.reporterClip, true)];
      body = ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          Text(
            officer
                ? 'Short clips, 30 seconds each. Your role comes first.'
                : 'A 30-second clip that shows how to report an accident.',
            style: RwType.body.copyWith(color: c.textPrimary),
          ),
          for (final (clip, video, mine) in cards) ...[
            const SizedBox(height: RwSpace.s16),
            _ClipCard(clip: clip, video: video, mine: mine),
          ],
        ],
      );
    }
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Demo video'),
      body: body,
    );
  }
}

/// Figma "Clip card": role tag (plus "Your role"), 30 seconds, title, description, the player
/// (or "Clip coming soon") and the transcript.
class _ClipCard extends StatefulWidget {
  const _ClipCard({required this.clip, required this.video, required this.mine});

  final _Clip clip;
  final VideoClip video;
  final bool mine;

  @override
  State<_ClipCard> createState() => _ClipCardState();
}

class _ClipCardState extends State<_ClipCard> {
  bool _transcriptOpen = false;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final clip = widget.clip;
    final url = widget.video.url;
    final transcript = widget.video.transcript;
    Widget tag(String text, Color fill) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: RwSpace.s4),
      decoration: BoxDecoration(color: fill, borderRadius: RwRadius.fullAll),
      child: Text(text, style: RwType.caption.copyWith(color: c.textPrimary)),
    );

    return Container(
      padding: const EdgeInsets.all(RwSpace.s16),
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: RwSpace.s8,
            runSpacing: RwSpace.s8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              tag(clip.role, c.surfaceNavySubtle),
              if (widget.mine) tag('Your role', c.brandAmber),
              Text('30 seconds', style: RwType.bodySm.copyWith(color: c.textMuted)),
            ],
          ),
          const SizedBox(height: RwSpace.s12),
          Semantics(
            header: true,
            child: Text(clip.title, style: RwType.h3.copyWith(color: c.textPrimary)),
          ),
          const SizedBox(height: RwSpace.s12),
          Text(clip.description, style: RwType.bodySm.copyWith(color: c.textMuted)),
          const SizedBox(height: RwSpace.s12),
          if (url != null)
            _DemoPlayer(url: url, role: clip.role)
          else
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Container(
                padding: const EdgeInsets.all(RwSpace.s16),
                decoration: BoxDecoration(color: c.surfaceNavySubtle, borderRadius: RwRadius.mdAll),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    RwIcon(RwIcons.playCircle, size: 32, color: c.textPrimary),
                    const SizedBox(height: RwSpace.s8),
                    Text('Clip coming soon', style: RwType.label.copyWith(color: c.textPrimary)),
                    const SizedBox(height: RwSpace.s4),
                    Text(
                      'The team publishes it before November\u00a02.',
                      textAlign: TextAlign.center,
                      style: RwType.bodySm.copyWith(color: c.textMuted),
                    ),
                  ],
                ),
              ),
            ),
          if (url != null && transcript != null) ...[
            Semantics(
              expanded: _transcriptOpen,
              child: RwPressable(
                onTap: () => setState(() => _transcriptOpen = !_transcriptOpen),
                semanticLabel: 'Read the transcript',
                excludeChildSemantics: true,
                borderRadius: RwRadius.smAll,
                builder: (context, s) => SizedBox(
                  height: RwSize.touch,
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Read the transcript',
                          style: RwType.label.copyWith(color: c.textPrimary),
                        ),
                      ),
                      AnimatedRotation(
                        turns: _transcriptOpen ? 0.5 : 0,
                        duration: RwMotion.reduced(context)
                            ? Duration.zero
                            : const Duration(milliseconds: 200),
                        child: RwIcon(RwIcons.chevronDown, size: 20, color: c.textPrimary),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (_transcriptOpen) Text(transcript, style: RwType.body.copyWith(color: c.textPrimary)),
          ],
        ],
      ),
    );
  }
}

/// Figma "Video player": navy poster with a round play button, then a controls bar
/// (play/pause, time, scrubber).
class _DemoPlayer extends StatefulWidget {
  const _DemoPlayer({required this.url, required this.role});
  final String url;
  final String role;

  @override
  State<_DemoPlayer> createState() => _DemoPlayerState();
}

class _DemoPlayerState extends State<_DemoPlayer> {
  late VideoPlayerController _controller;
  bool _ready = false;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    setState(() {
      _ready = false;
      _failed = false;
    });
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url));
    _controller.addListener(_onTick);
    try {
      await _controller.initialize();
      if (mounted) setState(() => _ready = true);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  void _onTick() {
    if (mounted) setState(() {});
  }

  Future<void> _retry() async {
    _controller.removeListener(_onTick);
    await _controller.dispose();
    await _init();
  }

  @override
  void dispose() {
    _controller.removeListener(_onTick);
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    if (!_ready) return;
    final v = _controller.value;
    if (v.isPlaying) {
      _controller.pause();
    } else {
      if (v.duration > Duration.zero && v.position >= v.duration) _controller.seekTo(Duration.zero);
      _controller.play();
    }
  }

  static String _fmt(Duration d) {
    final m = d.inMinutes;
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    if (_failed) {
      return RwEmptyState(
        icon: RwIcons.playCircle,
        title: "Couldn't play the video",
        message: 'Check your connection, then try again.',
        actionLabel: 'Try again',
        actionIcon: RwIcons.refresh,
        secondaryAction: true,
        isError: true,
        onAction: _retry,
      );
    }
    final v = _controller.value;
    final playing = _ready && v.isPlaying;
    final aspect = _ready && v.aspectRatio > 0 ? v.aspectRatio : 16 / 9;

    return ClipRRect(
      borderRadius: RwRadius.mdAll,
      child: ColoredBox(
        color: c.brandNavy,
        child: Column(
          children: [
            AspectRatio(
              aspectRatio: aspect,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (_ready)
                    Semantics(
                      label: '${widget.role} demo, 30 seconds',
                      image: true,
                      excludeSemantics: true,
                      child: VideoPlayer(_controller),
                    ),
                  if (!playing)
                    Center(
                      child: _ready
                          ? RwPressable(
                              onTap: _toggle,
                              semanticLabel: 'Play the ${widget.role} demo',
                              excludeChildSemantics: true,
                              onDark: true,
                              borderRadius: RwRadius.fullAll,
                              builder: (context, s) => Container(
                                width: 64,
                                height: 64,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: s.active ? c.surfaceNavySubtle : c.surfaceWhite,
                                  shape: BoxShape.circle,
                                ),
                                child: RwIcon(RwIcons.playCircle, size: 32, color: c.textPrimary),
                              ),
                            )
                          : Semantics(
                              label: 'Loading video',
                              liveRegion: true,
                              child: SizedBox(
                                width: 32,
                                height: 32,
                                child: CircularProgressIndicator(strokeWidth: 3, color: c.textInverse),
                              ),
                            ),
                    ),
                ],
              ),
            ),
            Container(
              color: c.surfaceNavyHover,
              padding: const EdgeInsets.only(left: RwSpace.s4, right: RwSpace.s12),
              child: Row(
                children: [
                  _PlayPauseButton(playing: playing, role: widget.role, onPressed: _ready ? _toggle : null),
                  const SizedBox(width: RwSpace.s4),
                  Text(
                    '${_fmt(v.position)} / ${_fmt(v.duration)}',
                    semanticsLabel: 'Played ${_fmt(v.position)} of ${_fmt(v.duration)}',
                    style: RwType.label.copyWith(color: c.textInverse),
                  ),
                  const SizedBox(width: RwSpace.s12),
                  Expanded(
                    child: _ready
                        ? SizedBox(
                            height: RwSize.touch,
                            child: Center(
                              child: VideoProgressIndicator(
                                _controller,
                                allowScrubbing: true,
                                padding: const EdgeInsets.symmetric(vertical: RwSpace.s12),
                                colors: VideoProgressColors(
                                  playedColor: c.textInverse,
                                  bufferedColor: c.textInverseMuted,
                                  backgroundColor: c.surfaceNavySubtle,
                                ),
                              ),
                            ),
                          )
                        : const SizedBox(height: RwSize.touch),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 48 px play/pause control on the navy bar. The icon set has no "pause", so the pause glyph
/// is two bars drawn with the inverse text color.
class _PlayPauseButton extends StatelessWidget {
  const _PlayPauseButton({required this.playing, required this.role, required this.onPressed});

  final bool playing;
  final String role;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwPressable(
      onTap: onPressed,
      semanticLabel: playing ? 'Pause the $role demo' : 'Play the $role demo',
      excludeChildSemantics: true,
      onDark: true,
      borderRadius: RwRadius.fullAll,
      builder: (context, s) {
        final fg = s.enabled ? c.textInverse : c.textInverseMuted;
        Widget bar() => Container(
          width: 4,
          height: 16,
          decoration: BoxDecoration(color: fg, borderRadius: RwRadius.fullAll),
        );
        return Container(
          width: RwSize.touch,
          height: RwSize.touch,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: s.active ? c.brandNavy : null, shape: BoxShape.circle),
          child: playing
              ? Row(mainAxisSize: MainAxisSize.min, children: [bar(), const SizedBox(width: 5), bar()])
              : RwIcon(RwIcons.playCircle, size: RwSize.iconLg, color: fg),
        );
      },
    );
  }
}
