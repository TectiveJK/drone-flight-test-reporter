import Foundation

let uavCategories = [
    "Fixed-Wing UAVs",
    "Multirotor UAVs",
    "Single-Rotor UAVs (Helicopter)",
    "VTOL UAVs",
    "Hybrid UAVs",
    "Lighter-than-Air UAVs",
    "Flapping-Wing / Ornithopter UAVs",
    "Unconventional / Experimental UAVs"
]

enum FlightResult: String, CaseIterable, Codable {
    case pending = "Pending"
    case pass = "Pass"
    case observations = "Pass with observations"
    case fail = "Fail"
    case aborted = "Aborted"
}

struct Flight: Identifiable, Codable {
    var id = UUID()
    var number: Int
    var dateTime = Date()
    var batteryID = ""
    var missionID = ""
    var duration = ""
    var flightModes = ""
    var missionPerformed = ""
    var telemetrySummary = ""
    var anomalies = ""
    var expectedBehaviour = ""
    var immediateAction = ""
    var findings = ""
    var operatorNotes = ""
    var result = FlightResult.pending
    var flightLogPath = ""
    var captureFilePath = ""
    var attachments: [String] = []
}

struct Report: Codable {
    var version = 1
    var testID = ""
    var project = ""
    var objective = ""
    var location = ""
    var operatorName = ""
    var observer = ""
    var uavCategory = ""
    var aircraftModel = ""
    var serialNumber = ""
    var flightController = ""
    var groundControl = ""
    var firmware = ""
    var weather = ""
    var flights: [Flight] = [Flight(number: 1)]
}

extension Report {
    var overallResult: FlightResult {
        if flights.contains(where: { $0.result == .fail }) { return .fail }
        if flights.contains(where: { $0.result == .aborted }) { return .aborted }
        if flights.contains(where: { $0.result == .observations }) { return .observations }
        if !flights.isEmpty && flights.allSatisfy({ $0.result == .pass }) { return .pass }
        return .pending
    }
}
