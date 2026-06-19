import ScrechKit

struct SettingsView: View {
    var body: some View {
        List {
            Section {
                let url = URL(string: "https://github.com/TopScrech/Swifty-Master")!
                
                Link(destination: url) {
                    HStack(spacing: 12) {
                        Image(.gitHub)
                            .resizable()
                            .frame(24)
                            .clipShape(.circle)
                        
                        Text("GitHub")
                    }
                }
                .tint(.primary)
            } footer: {
                Text("Bug reports, feature requests & contributions are always welcome!")
                    .secondary()
            }
        }
        .navigationTitle("Settings")
    }
}

#Preview {
    SettingsView()
}
