import UIKit
import WebKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    /*
     * Where the window actually is.
     *
     * This app is scene-based: SceneDelegate makes the window and holds it, so
     * `AppDelegate.window` is nil for the whole life of the process. Everything
     * here that reached for `window?.rootViewController` therefore reached for
     * nothing and returned quietly — which is why the left-edge swipe never
     * worked, the home-screen shortcuts went nowhere, and the film did not play.
     * A guard that never fires is worse than a crash: nothing to read anywhere.
     */
    private var stage: UIView? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }?
            .rootViewController?
            .view
            ?? UIApplication.shared.connectedScenes
                .compactMap { ($0 as? UIWindowScene)?.windows.first }
                .first?
                .rootViewController?
                .view
    }

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

        // A long press on the icon can also be a long press on a link: WKWebView's
        // own preview, which is the native context menu, for free.
        //
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
        if let web = Self.webView(in: stage) {
            web.allowsBackForwardNavigationGestures = true
            /* No link preview, and no menu behind a long press.
             *
             * `allowsLinkPreview` is Safari's: hold a link and it offers to open it,
             * to add it to a reading list, to copy it, to share it. In a browser that
             * is a service. In an app it is a browser's menu appearing in the middle
             * of an app — the reading list belongs to Safari, "open in new tab" has
             * nowhere to go here, and every one of those actions leads out of the
             * thing somebody is holding. A long press in an app should do what the
             * app says it does or nothing at all.
             *
             * The web side of the same thing is `-webkit-touch-callout: none`, which
             * is in app.css and takes effect without a build; this is the half that
             * stops the *preview* card as well as the menu. */
            web.allowsLinkPreview = false

            /* No rubber band, and this is the last piece of "the header moves and
             * the bar grows".
             *
             * A web view bounces its whole document past the ends of the page.
             * Nothing in this app wants that: the header is meant to be the one
             * fixed thing on the screen, and during a bounce it is dragged with
             * everything else — which is what "pull to refresh pulls the header
             * down" is. At the other end the same bounce opens a band of paper
             * under the bar, which reads as the bar having grown.
             *
             * The pull-to-refresh gesture does not need the bounce: it watches the
             * touches itself and moves its own strip of paper (see
             * components/app/PullDown.tsx), which is why it can be turned off here
             * without taking the gesture with it. CSS `overscroll-behavior` says
             * the same thing to a browser; this says it to the web view. */
            web.scrollView.bounces = false
            web.scrollView.alwaysBounceVertical = false
        }

        // A shortcut pressed on the home screen, if the app was already running.
        if let waiting = Self.waiting {
            Self.waiting = nil
            go(to: waiting)
        }

        // Anything shared to us from elsewhere on the phone.
        handShared()
    }

    // MARK: - Photographs shared from elsewhere

    /// The container the share extension writes into. Nil until the App Group
    /// exists on both targets, at which point this starts finding things — and
    /// until then every line below is a no-op rather than an error.
    private static var shared: URL? {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: "group.com.promenoodology.community")?
            .appendingPathComponent("shared", isDirectory: true)
    }

    /**
     * Hand what was shared to the app's own composer.
     *
     * The extension cannot post anything: it is a separate process with no idea
     * who is signed in. So it leaves pictures in the shared container and this
     * carries them across — as data URLs on a custom event, which is the only
     * thing a web view can be handed a photograph as without a server in the
     * middle. The files are removed as soon as they are passed on, so nothing
     * arrives twice and nothing sits on the disk waiting to.
     */
    private func handShared() {
        guard
            let folder = Self.shared,
            let web = Self.webView(in: stage),
            let note = try? Data(contentsOf: folder.appendingPathComponent("shared.json")),
            let read = try? JSONSerialization.jsonObject(with: note) as? [String: Any],
            let names = read["files"] as? [String],
            !names.isEmpty
        else { return }

        let words = (read["words"] as? String) ?? ""
        var pictures: [String] = []
        for name in names {
            let file = folder.appendingPathComponent(name)
            guard let data = try? Data(contentsOf: file) else { continue }
            pictures.append("data:image/jpeg;base64,\(data.base64EncodedString())")
            try? FileManager.default.removeItem(at: file)
        }
        try? FileManager.default.removeItem(at: folder.appendingPathComponent("shared.json"))
        guard !pictures.isEmpty else { return }

        let payload: [String: Any] = ["words": words, "pictures": pictures]
        guard
            let json = try? JSONSerialization.data(withJSONObject: payload),
            let text = String(data: json, encoding: .utf8)
        else { return }

        let script = """
        (function () {
          window.__promeShared = \(text);
          history.pushState({}, '', '/app/connect');
          window.dispatchEvent(new PopStateEvent('popstate'));
          window.dispatchEvent(new CustomEvent('prome:shared'));
        })();
        """
        web.evaluateJavaScript(script)
    }

    // MARK: - Shortcuts from the home screen

    /// Where a shortcut wants to go, when it arrived before there was a web view.
    private static var waiting: String?

    func application(
        _ application: UIApplication,
        performActionFor shortcutItem: UIApplicationShortcutItem,
        completionHandler: @escaping (Bool) -> Void
    ) {
        /*
         * Long-press the icon, land on the screen you meant.
         *
         * The address is in the shortcut's own userInfo rather than in a switch
         * here, so adding one is a change to Info.plist and nothing else.
         *
         * Two cases, and the difference matters: if the app is already running
         * the web view is there and can simply be sent somewhere; on a cold start
         * this is called before it exists, so the destination is held and used the
         * moment the app becomes active.
         */
        let where_ = (shortcutItem.userInfo?["where"] as? String) ?? "/app"
        if Self.webView(in: stage) == nil {
            Self.waiting = where_
        } else {
            go(to: where_)
        }
        completionHandler(true)
    }

    /// Send the app's own screens somewhere, without reloading the whole thing.
    private func go(to path: String) {
        guard let web = Self.webView(in: stage) else { return }
        /* history.pushState and a popstate, rather than location.href: the second
           would throw away the loaded app and start it again from the network,
           which for a shortcut meant to be a shortcut is the wrong end of the
           trade. This way the router hears a navigation and paints the screen. */
        let script = """
        (function () {
          try {
            history.pushState({}, '', '\(path)');
            window.dispatchEvent(new PopStateEvent('popstate'));
          } catch (e) {
            location.href = '\(path)';
          }
        })();
        """
        web.evaluateJavaScript(script)
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
