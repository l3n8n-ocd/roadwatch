import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/tokens.dart';

/// One tool in "Built with" (#49). [dark] is a white version of a one-color logo for dark surfaces.
class RwTool {
  const RwTool(this.name, this.file, {this.dark = false, this.display});
  final String name;
  final String file;
  final bool dark;

  /// The name as drawn, when it needs a line-break point (a zero-width space) to wrap like Figma.
  final String? display;

  String assetFor(Brightness brightness) {
    if (!dark || brightness == Brightness.light) return 'assets/logos/$file';
    final dot = file.lastIndexOf('.');
    return 'assets/logos/${file.substring(0, dot)}-dark${file.substring(dot)}';
  }
}

/// The groups shown on the web About pages (W9, W10), here and in the README; keep them in step.
const List<(String, List<RwTool>)> rwBuiltWith = [
  ('Design', [RwTool('Figma', 'figma.svg')]),
  (
    'Website',
    [
      RwTool('React', 'react.svg'),
      RwTool('Vite', 'vite.svg'),
      RwTool('Tailwind CSS', 'tailwind.svg'),
      RwTool('GSAP', 'gsap.svg'),
      RwTool('Recharts', 'recharts.png', dark: true),
      RwTool('Leaflet', 'leaflet.svg'),
    ],
  ),
  (
    'Android app',
    [RwTool('Flutter', 'flutter.svg'), RwTool('Dart', 'dart.svg'), RwTool('flutter_map', 'flutter_map.png')],
  ),
  (
    'API',
    [
      RwTool('Node.js', 'node.svg'),
      RwTool('Express', 'express.svg', dark: true),
      RwTool('Sequelize', 'sequelize.svg'),
      RwTool('Zod', 'zod.svg'),
      RwTool('JWT', 'jwt.svg', dark: true),
      RwTool('PDFKit', 'pdfkit.png', dark: true),
      RwTool('CSV export', 'csv.svg', dark: true),
    ],
  ),
  (
    'Data and services',
    [
      RwTool('MySQL', 'mysql.svg'),
      RwTool('Aiven', 'aiven.svg', dark: true),
      RwTool('Cloudinary', 'cloudinary.svg'),
      RwTool('Brevo', 'brevo.svg'),
      RwTool('OpenStreetMap', 'osm.svg', display: 'OpenStreet\u200BMap'),
      RwTool('Nominatim', 'nominatim.png'),
    ],
  ),
  (
    'Hosting and delivery',
    [
      RwTool('Vercel', 'vercel.svg', dark: true),
      RwTool('Render', 'render.svg', dark: true),
      RwTool('GitHub', 'github.svg', dark: true),
      RwTool('GitHub Actions', 'githubactions.svg'),
      RwTool('Git', 'git.svg'),
      RwTool('Namecheap', 'namecheap.svg'),
    ],
  ),
];

/// Figma "Built with" card on Settings/About (164:2646): group labels, then tiles three per row, each a
/// decorative logo (excluded from semantics) above the visible tool name.
class RwBuiltWith extends StatelessWidget {
  const RwBuiltWith({super.key});

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final (group, tools) in rwBuiltWith) ...[
          Padding(
            padding: const EdgeInsets.only(top: RwSpace.s16, bottom: RwSpace.s8),
            child: Semantics(
              header: true,
              child: Text(group, style: RwType.label.copyWith(color: c.textMuted)),
            ),
          ),
          LayoutBuilder(
            builder: (context, constraints) {
              const gap = RwSpace.s8;
              final width = (constraints.maxWidth - gap * 2) / 3;
              return Wrap(
                spacing: gap,
                runSpacing: gap,
                children: [for (final t in tools) _Tile(tool: t, width: width)],
              );
            },
          ),
        ],
      ],
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.tool, required this.width});

  final RwTool tool;
  final double width;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final asset = tool.assetFor(Theme.of(context).brightness);
    final logo = asset.endsWith('.svg')
        ? SvgPicture.asset(asset, height: 32, fit: BoxFit.contain)
        : Image.asset(asset, height: 32, fit: BoxFit.contain);
    return Container(
      width: width,
      padding: const EdgeInsets.symmetric(horizontal: RwSpace.s4, vertical: RwSpace.s12),
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.borderSubtle),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ExcludeSemantics(
            child: SizedBox(
              height: 32,
              width: width - 16,
              child: Center(child: logo),
            ),
          ),
          const SizedBox(height: RwSpace.s8),
          Text(
            tool.display ?? tool.name,
            semanticsLabel: tool.name,
            textAlign: TextAlign.center,
            style: RwType.caption.copyWith(color: c.textPrimary),
          ),
        ],
      ),
    );
  }
}
