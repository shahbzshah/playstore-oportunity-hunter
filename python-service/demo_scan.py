"""Demo: scan a Play Store keyword and print ranked opportunities.

Usage:
    python demo_scan.py "habit tracker" [--n 30] [--details 12]
"""

from __future__ import annotations

import argparse
import sys

sys.path.insert(0, ".")

from app import scraper, scoring


def main() -> int:
    ap = argparse.ArgumentParser(description="Scan Play Store for hidden gems")
    ap.add_argument("keyword")
    ap.add_argument("--n", type=int, default=30, help="search hits")
    ap.add_argument("--details", type=int, default=12,
                    help="how many to enrich with full details")
    args = ap.parse_args()

    print(f"Scanning Play Store for {args.keyword!r} ...")
    details = scraper.scan_keyword(args.keyword, n_hits=args.n,
                                   max_details=args.details)
    if not details:
        print("No results (network issue or empty search).")
        return 1
    ranked = scoring.rank_apps(details)

    print(f"\n{'#':<3}{'Score':<7}{'Title':<42}{'Rating':<8}{'Installs':<14}Gap")
    print("-" * 95)
    for i, s in enumerate(ranked[:15], 1):
        print(f"{i:<3}{s['opportunity']:<7}{s['title'][:40]:<42}"
              f"{s['rating']:<8}{str(s['installs']):<14}{s['breakdown']['gap']}")
    top = ranked[0]
    print(f"\nTop pick: {top['title']} ({top['appId']}) -- "
          f"opportunity {top['opportunity']}/100")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
