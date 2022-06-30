import * as React from 'react';
import HomeForm from './HomeForm';
import NavigationBar from './NavigationBar';
import PlaylistForm from './PlaylistForm';
import { SearchForm } from './SearchForm';
import SettingsForm from './SettingsForm';
export default class App extends React.Component<any, any> {
    navItems: string[];
    constructor(props: any) {
        super(props);
        this.handleNavClick = this.handleNavClick.bind(this);
        this.state = {
            navItem: "Home",
            Home: 'block',
            Search: 'none',
            Playlists: 'none',
            Settings: 'none',
        }
        this.navItems = ['Home', 'Search', 'Playlists', 'Settings']
    }

    handleNavClick(navItem: string) {
        this.navItems.forEach(n => {
            this.setState({
                [n]: navItem === n ? 'block' : 'none'
            })
        })
    }

    render() {
        return (
            <div>
                <div>
                    <NavigationBar navItems={['Home', 'Search', 'Playlists', 'Settings']} handleOnClick={this.handleNavClick} />
                </div>
                <div className="main">
                    <div className="Home" style={{ display:this.state.Home}}>
                        <HomeForm />
                    </div>
                    <div className="Search" style={{ display:this.state.Search}}>
                        <SearchForm />
                    </div>
                    <div className="Playlists" style={{ display:this.state.Playlists}}>
                        <PlaylistForm />
                    </div>
                    <div className="Settings" style={{ display:this.state.Settings}}>
                        <SettingsForm />
                    </div>
                </div>
            </div>
        )
    }
}
