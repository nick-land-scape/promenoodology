import UIKit
import WebKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.

        // Swipe from the left edge to go back, as in every other app on the phone.
        //
        // WKWebView can do this and Capacitor leaves it off. It is the single
        // biggest tell that something is a website in a wrapper: a person opens a
        // story, swipes to go back the way they do everywhere else, and nothing
        // happens. Client-side routing puts its own entries in the web view's
        // history, so the gesture walks the app's screens exactly as it walks a
        // browser's pages.
        //
        // Set here rather than in a subclass of the bridge's view controller,
        // because that would mean a new file in the Xcode project and a storyboard
        // pointing at it — three things to keep in step instead of one line that
        // is idempotent and runs whenever the app comes forward.
        if let web = Self.webView(in: window?.rootViewController?.view) {
            web.allowsBackForwardNavigationGestures = true
        }
    }

    /// The bridge's web view, wherever Capacitor has put it in the hierarchy.
    private static func webView(in view: UIView?) -> WKWebView? {
        guard let view else { return nil }
        if let web = view as? WKWebView { return web }
        for child in view.subviews {
            if let found = webView(in: child) { return found }
        }
        return nil
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
