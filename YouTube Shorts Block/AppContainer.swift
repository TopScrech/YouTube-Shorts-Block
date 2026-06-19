import SwiftUI

struct AppContainer: View {
    var body: some View {
        Group {
            if #available(iOS 16, *) {
                NavigationStack {
                    SetupInstructionsView()
                }
            } else {
                SetupInstructionsView()
            }
        }
#if os(macOS)
        .frame(minWidth: 360, minHeight: 520)
#endif
    }
}
