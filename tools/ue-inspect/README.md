# UE asset inspection

Read-only offline helper for reviewing Blueprint implementation when maintaining the portfolio. Uses [UAssetAPI](https://github.com/atenfyr/UAssetAPI) 1.1.0 and .NET 10. It never calls `UAsset.Write` or starts Unreal Editor.

```powershell
dotnet run --project tools/ue-inspect -- tools/ue-inspect/output/challenge F:/Learnproject/Challenge/Content/Code
node tools/ue-inspect/summarize.mjs tools/ue-inspect/output/challenge
```

Pass an explicit asset or a narrowly scoped asset directory. Directory inputs include all `.uasset` descendants. Output includes full asset JSON and a manifest with original source paths and SHA-256 hashes. The source hash is compared before and after parsing. Treat outputs as local project data; `output/`, `bin/`, and `obj/` are ignored and should not be published.

The readable summary is a navigation aid, not a full decompiler. It preserves function names, property names, call expressions and jump addresses, but some bytecode operations remain raw structures. Verify control flow against the JSON AST before turning an expression into an implementation claim. A successful parse does not confirm runtime behavior.
