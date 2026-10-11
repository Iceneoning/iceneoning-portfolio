using UAssetAPI;
using UAssetAPI.UnrealTypes;
using UAssetAPI.ExportTypes;
using System.Security.Cryptography;
using System.Text.Json;

// Read-only offline inspection. No UAsset.Write, editor startup or source mutation.
if (args.Length < 2) {
    Console.WriteLine("Usage: UeInspect <output-directory> <asset-or-directory> [...]");
    Console.WriteLine(string.Join(", ", Enum.GetNames<EngineVersion>().Where(n => n.StartsWith("VER_UE5"))));
    return;
}
var output = Path.GetFullPath(args[0]);
Directory.CreateDirectory(output);
var reports = new List<object>();
foreach (var input in args.Skip(1)) {
    var files = Directory.Exists(input) ? Directory.GetFiles(input, "*.uasset", SearchOption.AllDirectories) : new[] { input };
    foreach (var file in files) {
        try {
            var hash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(file)));
            var asset = new UAsset(file, EngineVersion.VER_UE5_7);
            var jsonPath = Path.Combine(output, Path.GetFileNameWithoutExtension(file) + ".json");
            File.WriteAllText(jsonPath, asset.SerializeJson());
            var raw = asset.Exports.Count(e => e is RawExport);
            reports.Add(new { source = file, sha256 = hash, exports = asset.Exports.Count, rawExports = raw, json = jsonPath });
            Console.WriteLine($"{Path.GetFileName(file)}: {asset.Exports.Count} exports, {raw} raw");
            if (hash != Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(file)))) throw new Exception("Source changed during inspection");
        } catch (Exception e) {
            reports.Add(new { source = file, error = e.Message });
            Console.WriteLine($"ERROR {Path.GetFileName(file)}: {e.Message}");
        }
    }
}
File.WriteAllText(Path.Combine(output, "manifest.json"), JsonSerializer.Serialize(reports, new JsonSerializerOptions { WriteIndented = true }));
