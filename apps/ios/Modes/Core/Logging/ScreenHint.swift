import UIKit
import LNPopupUI

/// Cheap "where is the user" description, read from the UIKit hierarchy so no UI file needs to cooperate.
@MainActor
enum ScreenHint {
    struct Snapshot: Sendable, Equatable {
        var tab: String?
        var popup: String?
        var presented: String?
        var text: String {
            [tab.map { "tab:\($0)" }, popup.map { "popup:\($0)" }, presented.map { "sheet:\($0)" }].compactMap { $0 }.joined(separator: " ")
        }
    }

    static func current() -> Snapshot {
        guard let root = foregroundWindows().last(where: { $0.isKeyWindow })?.rootViewController ?? foregroundWindows().first?.rootViewController
        else { return Snapshot() }
        var s = Snapshot()
        if let tabs = findTabController(root) {
            s.tab = tabs.selectedViewController?.tabBarItem.title ?? "tab\(tabs.selectedIndex)"
            s.popup = popupName(tabs.popupPresentationState)
        }
        var top: UIViewController? = root
        while let p = top?.presentedViewController { top = p }
        if let top, top !== root { s.presented = String(describing: type(of: top)) }
        return s
    }

    static func foregroundWindows() -> [UIWindow] {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .filter { $0.activationState == .foregroundActive }
            .flatMap(\.windows)
            .filter { !$0.isHidden && $0.alpha > 0 }
            .sorted { $0.windowLevel < $1.windowLevel }
    }

    private static func findTabController(_ vc: UIViewController) -> UITabBarController? {
        if let t = vc as? UITabBarController { return t }
        for child in vc.children { if let t = findTabController(child) { return t } }
        if let p = vc.presentedViewController { return findTabController(p) }
        return nil
    }

    private static func popupName(_ state: UIViewController.PopupPresentationState) -> String {
        switch state {
        case .barHidden: "hidden"
        case .barPresented: "bar"
        case .open: "open"
        default: "transitioning"
        }
    }
}
