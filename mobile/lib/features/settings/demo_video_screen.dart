import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// Demo video. Figma (Mobile page 90:4): Settings/Demo video/Playing 119:1923, Coming soon 119:1991.
///
/// Reads demoVideoUrl from GET /app-info and streams it with video_player (never bundled).
/// Null URL shows "Video coming soon". The video never auto-plays (reduced motion rule).
class DemoVideoScreen extends StatefulWidget {
  const DemoVideoScreen({super.key});

  @override
  State<DemoVideoScreen> createState() => _DemoVideoScreenState();
}

class _DemoVideoScreenState extends State<DemoVideoScreen> {
  bool _loading = true;
  ApiException? _error;
  String? _url;

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
        _url = info.demoVideoUrl;
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
    } else if (_url == null) {
      body = ListView(
        padding: const EdgeInsets.only(top: RwSpace.s48 - RwSpace.s32),
        children: const [RwEmptyState.videoComingSoon()],
      );
    } else {
      body = ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          Text(
            'See how RoadWatch works, from reporting an accident to an officer closing it.',
            style: RwType.body.copyWith(color: c.textPrimary),
          ),
          const SizedBox(height: RwSpace.s16),
          _DemoPlayer(url: _url!),
          const SizedBox(height: RwSpace.s16),
          Text('RoadWatch product demo', style: RwType.label.copyWith(color: c.textPrimary)),
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

/// Figma "Video player": navy poster with a round play button, then a controls bar
/// (play/pause, time, scrubber).
class _DemoPlayer extends StatefulWidget {
  const _DemoPlayer({required this.url});
  final String url;

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
                      label: 'RoadWatch demo video',
                      image: true,
                      excludeSemantics: true,
                      child: VideoPlayer(_controller),
                    ),
                  if (!playing)
                    Center(
                      child: _ready
                          ? RwPressable(
                              onTap: _toggle,
                              semanticLabel: 'Play demo video',
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
                  _PlayPauseButton(playing: playing, onPressed: _ready ? _toggle : null),
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
  const _PlayPauseButton({required this.playing, required this.onPressed});

  final bool playing;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwPressable(
      onTap: onPressed,
      semanticLabel: playing ? 'Pause demo video' : 'Play demo video',
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
