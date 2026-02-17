targetScope = 'resourceGroup'

@description('Optional. Location for all resources.')
param location string = resourceGroup().location

@description('Optional. Tags applied to all resources.')
param tags object = {}

@description('Optional. Short prefix used to generate resource names.')
@minLength(2)
@maxLength(12)
param prefix string = 'geiri'

var uniq = substring(uniqueString(subscription().id, resourceGroup().id), 0, 6)

@description('Required. Azure Static Web App name (max 40 chars).')
@minLength(1)
@maxLength(40)
param staticWebAppName string = 'geiri-is'

@description('Optional. Public site base URL (used for LinkedIn callback link generation). Set to your custom domain once configured (e.g. https://geiri.is).')
param siteUrl string = 'https://${staticWebAppName}.azurestaticapps.net'

@description('Optional. Cosmos DB account name override. If empty, a unique name is generated. Must be lowercase and 3-44 chars.')
param cosmosAccountName string = ''

var effectiveCosmosAccountName = !empty(cosmosAccountName)
  ? cosmosAccountName
  : take(toLower(replace('${prefix}cosmos${uniq}', '-', '')), 44)

@description('Optional. Cosmos DB database id.')
param cosmosDatabaseId string = 'geiri-is'

@description('Optional. Cosmos DB container id for posts.')
param cosmosPostsContainerId string = 'posts'

#disable-next-line secure-secrets-in-params
@description('Optional. Cosmos DB container id for secrets.')
param cosmosSecretsContainerId string = 'secrets'

@description('Optional. Log Analytics workspace name override. If empty, a unique name is generated.')
param logAnalyticsWorkspaceName string = ''

var effectiveLogAnalyticsWorkspaceName = !empty(logAnalyticsWorkspaceName)
  ? logAnalyticsWorkspaceName
  : take('${prefix}-law-${uniq}', 63)

@description('Optional. Application Insights name override. If empty, a unique name is generated.')
param appInsightsName string = ''

var effectiveAppInsightsName = !empty(appInsightsName)
  ? appInsightsName
  : take('${prefix}-appi-${uniq}', 260)

module logAnalytics 'br/public:avm/res/operational-insights/workspace:0.15.0' = {
  name: take('avm.res.operational-insights.workspace.${effectiveLogAnalyticsWorkspaceName}', 64)
  params: {
    name: effectiveLogAnalyticsWorkspaceName
    location: location
    tags: tags
  }
}

module appInsights 'br/public:avm/res/insights/component:0.7.1' = {
  name: take('avm.res.insights.component.${effectiveAppInsightsName}', 64)
  params: {
    name: effectiveAppInsightsName
    location: location
    tags: tags
    disableIpMasking: false
    workspaceResourceId: logAnalytics.outputs.resourceId
  }
}

module cosmos 'br/public:avm/res/document-db/database-account:0.18.0' = {
  name: take('avm.res.document-db.database-account.${effectiveCosmosAccountName}', 64)
  params: {
    name: effectiveCosmosAccountName
    location: location
    tags: tags
    // Cosmos DB for NoSQL is implied via the SQL DB child resources.
    sqlDatabases: [
      {
        name: cosmosDatabaseId
        containers: [
          {
            name: cosmosPostsContainerId
            paths: [
              '/pk'
            ]
            kind: 'Hash'
            version: 2
          }
          {
            name: cosmosSecretsContainerId
            paths: [
              '/pk'
            ]
            kind: 'Hash'
            version: 2
          }
        ]
      }
    ]
    zoneRedundant: false
  }
}

module staticSite 'br/public:avm/res/web/static-site:0.9.3' = {
  name: take('avm.res.web.static-site.${staticWebAppName}', 64)
  params: {
    name: staticWebAppName
    location: location
    tags: tags
    sku: 'Free'
    appSettings: {
      SITE_URL: siteUrl

      COSMOS_ENDPOINT: cosmos.outputs.endpoint
      COSMOS_KEY: cosmos.outputs.primaryReadWriteKey
      COSMOS_DATABASE_ID: cosmosDatabaseId
      COSMOS_POSTS_CONTAINER_ID: cosmosPostsContainerId
      COSMOS_SECRETS_CONTAINER_ID: cosmosSecretsContainerId

      // For the admin stats endpoint, you still need to create an App Insights API key and set APPINSIGHTS_API_KEY.
      APPINSIGHTS_APP_ID: appInsights.outputs.applicationId
    }
  }
}

@description('Static Web App resource ID.')
output staticWebAppResourceId string = staticSite.outputs.resourceId

@description('Static Web App default hostname (azurestaticapps.net).')
output staticWebAppDefaultHostname string = staticSite.outputs.defaultHostname

@description('Cosmos DB endpoint.')
output cosmosEndpoint string = cosmos.outputs.endpoint

@description('Cosmos DB primary read-write key (store as secret).')
@secure()
output cosmosPrimaryKey string = cosmos.outputs.primaryReadWriteKey

@description('Application Insights applicationId (APPINSIGHTS_APP_ID).')
output appInsightsAppId string = appInsights.outputs.applicationId
