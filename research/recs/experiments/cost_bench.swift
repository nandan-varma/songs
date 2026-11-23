import Foundation
import Accelerate

func now() -> Double { Double(DispatchTime.now().uptimeNanoseconds) / 1e6 }
func median(_ f: () -> Void, runs: Int = 200) -> Double {
    var t: [Double] = []
    for _ in 0..<runs { let a = now(); f(); t.append(now() - a) }
    t.sort(); return t[t.count / 2]
}

let V = 14_000, D = 64, K = 12, N = 500, H = 1 << 15
var g = SystemRandomNumberGenerator()
var vocab: [String: Int] = [:]
for i in 0..<V { vocab["a|token\(i)"] = i }
var table16 = [Float16](repeating: 0, count: V * D)
for i in 0..<table16.count { table16[i] = Float16(Float.random(in: -0.3...0.3, using: &g)) }
let keys = Array(vocab.keys)
let songs: [[String]] = (0..<N).map { _ in (0..<K).map { _ in keys.randomElement(using: &g)! } }
var vecs = [Float](repeating: 0, count: N * D)

let tEmbed = median {
    var tmp = [Float](repeating: 0, count: D)
    for s in 0..<N {
        for d in 0..<D { tmp[d] = 0 }
        var n: Float = 0
        for tok in songs[s] {
            guard let id = vocab[tok] else { continue }
            n += 1
            table16.withUnsafeBufferPointer { p in
                for d in 0..<D { tmp[d] += Float(p[id * D + d]) }
            }
        }
        var norm: Float = 0
        vDSP_svesq(tmp, 1, &norm, vDSP_Length(D))
        var scale = 1 / max(norm.squareRoot(), 1e-6)
        vDSP_vsmul(tmp, 1, &scale, &tmp, 1, vDSP_Length(D))
        for d in 0..<D { vecs[s * D + d] = tmp[d] }
    }
}

let dim = H + D
var prec = [Float](repeating: 1, count: dim), info = [Float](repeating: 0, count: dim)
let sparseIdx: [[Int32]] = (0..<N).map { _ in (0..<K).map { _ in Int32.random(in: 0..<Int32(H), using: &g) } }
let sparseVal: [[Float]] = (0..<N).map { _ in (0..<K).map { _ in Float.random(in: -0.4...0.4, using: &g) } }
var scores = [Float](repeating: 0, count: N)
let tScoreDiag = median {
    for s in 0..<N {
        var t: Float = 0
        for (k, i) in sparseIdx[s].enumerated() { t += info[Int(i)] / prec[Int(i)] * sparseVal[s][k] }
        vecs.withUnsafeBufferPointer { p in
            for d in 0..<D { t += info[H + d] / prec[H + d] * 0.5 * p[s * D + d] }
        }
        scores[s] = t
    }
}

let tObserveDiag = median({
    let s = Int.random(in: 0..<N)
    for (k, i) in sparseIdx[s].enumerated() {
        let v = sparseVal[s][k]; prec[Int(i)] += v * v; info[Int(i)] += v
    }
    for d in 0..<D {
        let v = 0.5 * vecs[s * D + d]; prec[H + d] += v * v; info[H + d] += v
    }
}, runs: 2000)

var A = [Float](repeating: 0, count: D * D)
for i in 0..<D { A[i * D + i] = 1 }
var b = [Float](repeating: 0, count: D)
let tDenseUpdate = median({
    let s = Int.random(in: 0..<N)
    vecs.withUnsafeBufferPointer { p in
        cblas_ssyr(CblasRowMajor, CblasUpper, Int32(D), 1, p.baseAddress! + s * D, 1, &A, Int32(D))
        cblas_saxpy(Int32(D), 1, p.baseAddress! + s * D, 1, &b, 1)
    }
}, runs: 2000)

var mean = [Float](repeating: 0, count: D)
let tSolve = median {
    var Ac = A; var x = b; var n = Int32(D); var nrhs: Int32 = 1; var lda = Int32(D); var ldb = Int32(D); var info: Int32 = 0
    var uplo = Int8(UInt8(ascii: "U"))
    sposv_(&uplo, &n, &nrhs, &Ac, &lda, &x, &ldb, &info)
    mean = x
}
var dense = [Float](repeating: 0, count: N)
let tDenseScore = median {
    vecs.withUnsafeBufferPointer { p in
        cblas_sgemv(CblasRowMajor, CblasNoTrans, Int32(N), Int32(D), 1, p.baseAddress!, Int32(D), mean, 1, 0, &dense, 1)
    }
}
let tThompson = median {
    var Ac = A; var n = Int32(D); var lda = Int32(D); var info: Int32 = 0
    var uplo = Int8(UInt8(ascii: "U"))
    spotrf_(&uplo, &n, &Ac, &lda, &info)
    var z = (0..<D).map { _ in Float.random(in: -1...1, using: &g) }
    var nn = Int32(D), one: Int32 = 1, ldz = Int32(D)
    var diag = Int8(UInt8(ascii: "N")), trans = Int8(UInt8(ascii: "N"))
    strtrs_(&uplo, &trans, &diag, &nn, &one, &Ac, &lda, &z, &ldz, &info)
    var w = mean; vDSP_vadd(w, 1, z, 1, &w, 1, vDSP_Length(D))
    vecs.withUnsafeBufferPointer { p in
        cblas_sgemv(CblasRowMajor, CblasNoTrans, Int32(N), Int32(D), 1, p.baseAddress!, Int32(D), w, 1, 0, &dense, 1)
    }
}
func f(_ x: Double) -> String { String(format: "%.4f ms", x) }
print("embed 500 songs (token lookup + mean + norm):", f(tEmbed))
print("score 500, diag ridge sparse + 64 dense dims:", f(tScoreDiag))
print("observe one feedback (diag, sparse+64 dense):", f(tObserveDiag))
print("dense head rank-1 update (64x64):", f(tDenseUpdate))
print("dense head posterior mean solve (64x64):", f(tSolve))
print("dense head score 500 (gemv):", f(tDenseScore))
print("dense head Thompson sample (chol+score 500):", f(tThompson))
print("table fp16 bytes:", V * D * 2, " vocab strings approx bytes:", keys.reduce(0) { $0 + $1.utf8.count })
print("learner state bytes (diag, 2 arrays fp32):", dim * 2 * 4, " dense A+b bytes:", (D * D + D) * 4)
