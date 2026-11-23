import Foundation
import SoundAnalysis

final class Obs: NSObject, SNResultsObserving {
    var sum: [String: Double] = [:], mx: [String: Double] = [:], n = 0
    var err: Error?
    func request(_ request: SNRequest, didProduce result: SNResult) {
        guard let r = result as? SNClassificationResult else { return }
        n += 1
        for c in r.classifications { sum[c.identifier, default: 0] += c.confidence; mx[c.identifier] = max(mx[c.identifier] ?? 0, c.confidence) }
    }
    func request(_ request: SNRequest, didFailWithError error: Error) { err = error }
    func requestDidComplete(_ request: SNRequest) {}
}

let args = CommandLine.arguments
let probe = try SNClassifySoundRequest(classifierIdentifier: .version1)
let names = probe.knownClassifications.sorted()
if args.count >= 2 && args[1] == "--classes" { print(names.joined(separator: "\n")); exit(0) }
let ids = try String(contentsOfFile: args[1], encoding: .utf8).split(separator: "\n").map(String.init)
let clipDir = args[2], out = args[3]
var csv = "songId,secs,windows," + names.map { "mean_\($0)" }.joined(separator: ",") + "," + names.map { "max_\($0)" }.joined(separator: ",") + "\n"
for id in ids {
    let t0 = Date()
    let url = URL(fileURLWithPath: "\(clipDir)/\(id).mp3")
    do {
        let an = try SNAudioFileAnalyzer(url: url)
        let req = try SNClassifySoundRequest(classifierIdentifier: .version1)
        let o = Obs()
        try an.add(req, withObserver: o)
        an.analyze()
        let dt = Date().timeIntervalSince(t0)
        let nn = Double(max(o.n, 1))
        csv += "\(id),\(dt),\(o.n)," + names.map { String((o.sum[$0] ?? 0) / nn) }.joined(separator: ",") + "," + names.map { String(o.mx[$0] ?? 0) }.joined(separator: ",") + "\n"
    } catch { FileHandle.standardError.write("fail \(id): \(error)\n".data(using: .utf8)!) }
}
try csv.write(toFile: out, atomically: true, encoding: .utf8)
